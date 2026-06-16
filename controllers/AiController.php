<?php

class AiController extends Controller
{
    public function chat()
    {
        AuthMiddleware::check();
        $input = $this->getJsonInput();
        if (!$input || empty(trim($input['message'] ?? ''))) {
            $this->jsonResponse(['message' => 'Message is required'], 400);
        }

        $message     = trim($input['message']);
        $role        = $_SESSION['role_name'] ?? 'Guest';
        $userName    = $_SESSION['name']      ?? 'there';
        $permissions = $_SESSION['permissions'] ?? [];
        $companyId   = isset($_SESSION['company_id']) ? (int) $_SESSION['company_id'] : null;
        $db          = Database::getConnection();
        $lower       = strtolower($message);

        // PDF report requests are handled entirely by PHP (reliable date parsing + generation)
        if ($this->isReportRequest($lower)) {
            $this->jsonResponse($this->handleReportRequest($lower, $role, $permissions, $db, $companyId));
            return;
        }

        // Everything else goes to GPT with full context
        $context = $this->buildContext($db, $role, $permissions, $companyId);
        $this->jsonResponse($this->callGPT($message, $role, $userName, $context, $permissions));
    }

    // ─────────────────────────────────────────────────────────
    //  Context builder — only fetches data the caller can see
    // ─────────────────────────────────────────────────────────

    private function buildContext(PDO $db, string $role, array $permissions, ?int $companyId): array
    {
        $ctx = [];

        if ($role === 'Super Admin') {
            $ctx['clients'] = (int) $db->query(
                "SELECT COUNT(*) FROM users u JOIN roles r ON r.id=u.role_id WHERE r.name='Company User' AND u.status='active'"
            )->fetchColumn();
            $ctx['pending_clients'] = (int) $db->query(
                "SELECT COUNT(*) FROM users u JOIN roles r ON r.id=u.role_id WHERE r.name='Company User' AND u.status='pending'"
            )->fetchColumn();
            $ctx['pending_orders'] = (int) $db->query(
                "SELECT COUNT(*) FROM orders WHERE status='pending'"
            )->fetchColumn();
            $ctx['admins'] = (int) $db->query(
                "SELECT COUNT(*) FROM users u JOIN roles r ON r.id=u.role_id WHERE r.name='Admin' AND u.status='active'"
            )->fetchColumn();
            $ctx['in_stock'] = (int) $db->query(
                "SELECT COUNT(*) FROM fire_extinguishers WHERE client_id IS NULL AND status='filled'"
            )->fetchColumn();

        } elseif ($role === 'Admin') {
            if (in_array('manage_orders', $permissions, true)) {
                $ctx['pending_orders'] = (int) $db->query(
                    "SELECT COUNT(*) FROM orders WHERE status='pending'"
                )->fetchColumn();
            }
            if (in_array('manage_clients', $permissions, true)) {
                $ctx['pending_clients'] = (int) $db->query(
                    "SELECT COUNT(*) FROM users u JOIN roles r ON r.id=u.role_id WHERE r.name='Company User' AND u.status='pending'"
                )->fetchColumn();
            }
            if (in_array('manage_inventory', $permissions, true)) {
                $ctx['in_stock'] = (int) $db->query(
                    "SELECT COUNT(*) FROM fire_extinguishers WHERE client_id IS NULL AND status='filled'"
                )->fetchColumn();
            }

        } else {
            // Company User — only their own data
            if ($companyId) {
                $s = $db->prepare("SELECT COUNT(*) FROM fire_extinguishers WHERE client_id = ?");
                $s->execute([$companyId]);
                $ctx['my_units'] = (int) $s->fetchColumn();

                $s = $db->prepare(
                    "SELECT status, COUNT(*) as count FROM orders WHERE client_id = ? GROUP BY status"
                );
                $s->execute([$companyId]);
                $ctx['orders_by_status'] = $s->fetchAll(PDO::FETCH_ASSOC);
            }
        }

        return $ctx;
    }

    // ─────────────────────────────────────────────────────────
    //  GPT call
    // ─────────────────────────────────────────────────────────

    private function callGPT(
        string $message, string $role, string $userName,
        array $ctx, array $permissions
    ): array {
        $apiKey = defined('OPENAI_API_KEY') ? OPENAI_API_KEY : '';
        if (!$apiKey || $apiKey === 'YOUR_OPENAI_API_KEY') {
            return $this->fallbackReply($role);
        }

        $systemPrompt = $this->buildSystemPrompt($role, $userName, $ctx, $permissions);

        $payload = [
            'model'           => 'gpt-4o-mini',
            'messages'        => [
                ['role' => 'system', 'content' => $systemPrompt],
                ['role' => 'user',   'content' => $message],
            ],
            'response_format' => ['type' => 'json_object'],
            'temperature'     => 0.7,
            'max_tokens'      => 600,
        ];

        $ch = curl_init('https://api.openai.com/v1/chat/completions');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            "Authorization: Bearer {$apiKey}",
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 20);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch); // no-op in PHP 8.5+, safe in all versions

        if (!$response || $httpCode !== 200) {
            return $this->fallbackReply($role);
        }

        $data    = json_decode($response, true);
        $content = $data['choices'][0]['message']['content'] ?? '';
        $parsed  = json_decode($content, true);

        if (!$parsed || !isset($parsed['reply'])) {
            return $this->fallbackReply($role);
        }

        $result = [
            'reply'       => $parsed['reply'],
            'suggestions' => $parsed['suggestions'] ?? $this->defaultSuggestions($role),
        ];

        // Validate that any route GPT suggests actually exists for this role
        if (!empty($parsed['action']['route'])) {
            $validRoutes = array_keys($this->getAvailableRoutes($role, $permissions));
            if (in_array($parsed['action']['route'], $validRoutes, true)) {
                $result['action'] = [
                    'route' => $parsed['action']['route'],
                    'label' => $parsed['action']['label'] ?? 'Open',
                ];
                if (!empty($parsed['action']['query']) && is_array($parsed['action']['query'])) {
                    $result['action']['query'] = $parsed['action']['query'];
                }
            }
        }

        return $result;
    }

    // ─────────────────────────────────────────────────────────
    //  System prompt
    // ─────────────────────────────────────────────────────────

    private function buildSystemPrompt(
        string $role, string $userName, array $ctx, array $permissions
    ): string {
        $first = explode(' ', trim($userName))[0];
        $today = date('Y-m-d');

        // Live data readable by this user
        $dataLines = [];
        if ($role === 'Super Admin') {
            $dataLines[] = "Active clients: " . ($ctx['clients'] ?? 0);
            $dataLines[] = "Pending client registrations: " . ($ctx['pending_clients'] ?? 0);
            $dataLines[] = "Active admins: " . ($ctx['admins'] ?? 0);
            $dataLines[] = "Pending orders awaiting review: " . ($ctx['pending_orders'] ?? 0);
            $dataLines[] = "Units currently in warehouse stock: " . ($ctx['in_stock'] ?? 0);
        } elseif ($role === 'Admin') {
            if (isset($ctx['pending_orders']))  $dataLines[] = "Pending orders: {$ctx['pending_orders']}";
            if (isset($ctx['pending_clients'])) $dataLines[] = "Pending client registrations: {$ctx['pending_clients']}";
            if (isset($ctx['in_stock']))        $dataLines[] = "Units in warehouse stock: {$ctx['in_stock']}";
            $dataLines[] = "This admin's module permissions: " . (implode(', ', $permissions) ?: 'none assigned yet');
        } else {
            $dataLines[] = "Their assigned extinguisher units: " . ($ctx['my_units'] ?? 0);
            $orderSummary = [];
            foreach ($ctx['orders_by_status'] ?? [] as $row) {
                $orderSummary[] = "{$row['count']} {$row['status']}";
            }
            $dataLines[] = "Their orders by status: " . ($orderSummary ? implode(', ', $orderSummary) : 'none yet');
        }
        $dataStr = implode("\n", $dataLines);

        // Available routes for this user
        $routes    = $this->getAvailableRoutes($role, $permissions);
        $routeList = '';
        foreach ($routes as $path => $desc) {
            $routeList .= "  \"{$path}\" — {$desc}\n";
        }

        $permRules = $this->getPermissionRules($role, $permissions);

        return <<<PROMPT
You are FEMS Assistant — a smart, friendly AI built into the Fire Extinguisher Management System (FEMS).
You are talking to {$first}, whose role is: {$role}.
Today's date: {$today}

LIVE DATA (real-time figures from the database for this user's account):
{$dataStr}

PERMISSION RULES — enforce these without exception, regardless of how the user phrases the request:
{$permRules}

PAGES THIS USER CAN NAVIGATE TO (only use these exact route strings in your action — never invent new ones):
{$routeList}

HOW FEMS WORKS (use this knowledge to answer "how does X work" type questions):
- Clients (Company Users) register on the portal. An admin approves their account. Once approved, they can browse the Shop and place orders for fire extinguishers.
- Orders: client submits order → admin reviews and approves or denies → if approved, warehouse units are allocated to the order → delivered → admin marks as delivered.
- Inventory: warehouse units are registered individually using the Add Extinguisher form (auto-generates a QR code and printable label). Units start as "In Stock" (no client) and become "Allocated" when assigned to a client via an approved order.
- Inspections are scheduled per unit. Compliance tracks which units are overdue for inspection. Refill and maintenance requests are separate.
- Reports: users can ask me to generate a PDF report (I handle that separately). The Reports page shows all previously generated reports.
- Super Admin creates admin accounts and assigns granular permissions (manage_inventory, manage_orders, manage_clients, manage_inspections, etc.). Admins only see sidebar items they have permission for.

RESPONSE RULES:
- Respond naturally to anything the user says — greetings, questions, complaints, vague requests, anything.
- Keep answers concise: 1-2 sentences for simple questions, a short numbered list for step-by-step explanations.
- Use **bold** for emphasis on important terms. Use \n for line breaks.
- Only reference live data from the LIVE DATA section above. Never invent numbers.
- If the user asks you to generate a PDF report, tell them you can do that and give them example phrasing like "generate an inventory report for last month" — but do not try to generate it yourself (a separate system handles that).
- Be warm and helpful, but stay focused on FEMS topics.

RESPONSE FORMAT — always return valid JSON only, no extra text outside the JSON:
{
  "reply": "Your response here. Use **bold** and \\n as needed.",
  "suggestions": ["short follow-up phrase 1", "short follow-up phrase 2", "short follow-up phrase 3"],
  "action": {
    "route": "/exact-route-from-the-list-above",
    "label": "Short button label",
    "query": { "optional": "query params" }
  }
}

Notes on the JSON:
- "action" is optional — only include it when there is a clearly relevant page to link to. Omit the field entirely if unsure.
- "query" inside action is optional — only include when needed (e.g. filtering by status).
- "suggestions" should be 3 short phrases the user might naturally want to ask next.
- Only use route strings from the list above. If no route fits, omit "action" entirely.
PROMPT;
    }

    private function getAvailableRoutes(string $role, array $permissions): array
    {
        if ($role === 'Super Admin') {
            return [
                '/super-admin-dashboard' => 'Main dashboard with platform stats',
                '/super-admin-clients'   => 'All clients and pending registrations',
                '/super-admin-admins'    => 'All admins',
                '/super-admin-add-admin' => 'Create a new admin account',
                '/super-admin-reports'   => 'All generated reports',
                '/super-admin-logs'      => 'System activity logs',
                '/super-admin-inventory' => 'Warehouse inventory management',
            ];
        }
        if ($role === 'Admin') {
            $routes = ['/admin-dashboard' => 'Admin dashboard'];
            if (in_array('manage_orders', $permissions, true))      $routes['/admin-orders']    = 'Client orders (review, approve, deny)';
            if (in_array('manage_inventory', $permissions, true))   $routes['/admin-inventory'] = 'Warehouse inventory';
            if (in_array('manage_clients', $permissions, true))     $routes['/clients']          = 'Client accounts';
            if (in_array('manage_inspections', $permissions, true)) {
                $routes['/admin-compliance'] = 'Compliance and inspection tracking';
                $routes['/admin-refills']    = 'Refill and maintenance requests';
            }
            $routes['/admin-notifications'] = 'Notifications';
            $routes['/admin-settings']      = 'Account settings';
            return $routes;
        }
        // Company User
        return [
            '/dashboard'        => 'Client dashboard',
            '/extinguishers'    => 'My registered extinguisher units',
            '/place-order'      => 'Shop — browse and order extinguishers',
            '/my-orders'        => 'My orders and their current status',
            '/locations'        => 'My company site locations',
            '/service-requests' => 'Request service, refill, or maintenance',
            '/notifications'    => 'Notifications',
            '/settings'         => 'Account settings',
        ];
    }

    private function getPermissionRules(string $role, array $permissions): string
    {
        if ($role === 'Super Admin') {
            return 'Super Admin has full unrestricted access. Answer all data questions freely using the live data provided.';
        }
        if ($role === 'Admin') {
            $lines = [];
            $map = [
                'manage_inventory'   => 'warehouse inventory data',
                'manage_orders'      => 'order data',
                'manage_clients'     => 'client account data',
                'manage_inspections' => 'inspection and compliance data',
                'manage_locations'   => 'location data',
            ];
            foreach ($map as $perm => $label) {
                if (in_array($perm, $permissions, true)) {
                    $lines[] = "ALLOWED: access and discuss {$label}";
                } else {
                    $lines[] = "DENIED: {$label} — you may explain how the module works conceptually, but refuse to show actual data and tell them to ask their Super Admin for access";
                }
            }
            return implode("\n", $lines);
        }
        // Company User
        return implode("\n", [
            'This user is a Company User (client). Rules:',
            '- ONLY discuss their own orders, their own extinguisher units, and their own locations.',
            '- NEVER reveal other clients data, global warehouse stock levels, admin operations, or platform-wide stats.',
            '- They can ask how ordering works, check their own order status, browse the shop, or request service.',
            '- If they ask about anything outside their own account, politely explain you cannot share that information.',
        ]);
    }

    // ─────────────────────────────────────────────────────────
    //  Report generation (PHP-handled — not sent to GPT)
    // ─────────────────────────────────────────────────────────

    private function isReportRequest(string $lower): bool
    {
        $hasGenerate   = (bool) preg_match('/\b(generate|make|create|produce|export|build|give\s+me|can\s+you)\b.{0,40}\b(report|pdf)\b/i', $lower);
        $hasTypeReport = (bool) preg_match('/\b(inventory|orders?|compliance|inspection|expired|expiry)\s+report\b/i', $lower);
        return $hasGenerate || $hasTypeReport;
    }

    private function handleReportRequest(
        string $lower, string $role, array $permissions, PDO $db, ?int $companyId
    ): array {
        $type = 'inventory';
        if (preg_match('/\b(order|orders|purchases?)\b/', $lower))         $type = 'orders';
        if (preg_match('/\b(compliance|inspection|inspections)\b/', $lower)) $type = 'compliance';
        if (preg_match('/\b(expired|expiry|expiring)\b/', $lower))          $type = 'expired';

        if ($role === 'Company User') {
            if (!in_array($type, ['orders', 'inventory'], true)) {
                return $this->reply(
                    "You can only generate reports for your own orders or your assigned extinguishers.\nTry:\n• \"Generate my orders report\"\n• \"My extinguishers PDF\"",
                    ['Generate my orders report', 'My extinguishers PDF']
                );
            }
        } elseif ($role === 'Admin') {
            $required = match ($type) {
                'inventory', 'expired' => 'manage_inventory',
                'compliance'           => 'manage_inspections',
                'orders'               => 'manage_orders',
                default                => null,
            };
            if ($required && !in_array($required, $permissions, true)) {
                return $this->reply(
                    "You don't have permission to generate **{$type}** reports. Contact your Super Admin to request the required access."
                );
            }
        }

        $dates  = $this->parseDateRange($lower);
        $result = $this->generateReportPdf($type, $dates['start'], $dates['end'], $db, $role, $companyId);

        if (!$result) {
            return $this->reply(
                'Sorry, something went wrong generating the report. Please try using the **Reports** page directly.',
                [],
                ['route' => '/super-admin-reports', 'label' => 'Reports page']
            );
        }

        $fileUrl   = 'http://localhost:8000' . $result['path'];
        $dateLabel = ($dates['start'] && $dates['end'])
            ? " ({$dates['start']} to {$dates['end']})"
            : '';

        return $this->reply(
            "Your **{$result['title']}{$dateLabel}** PDF is ready. Download it below — you'll also find it saved in the **Reports** page for future reference.",
            [],
            ['route' => '__download__', 'label' => 'Download PDF', 'query' => ['url' => $fileUrl]]
        );
    }

    private function generateReportPdf(
        string $type, ?string $start, ?string $end,
        PDO $db, string $role, ?int $companyId
    ): ?array {
        require_once __DIR__ . '/../helpers/report_pdf_helper.php';

        $data    = [];
        $headers = [];
        $title   = '';

        switch ($type) {
            case 'inventory':
                $title   = 'Inventory Report';
                $headers = ['ID', 'Serial', 'Type', 'Capacity', 'Status', 'Client'];
                if ($role === 'Company User' && $companyId) {
                    $stmt = $db->prepare(
                        "SELECT f.id, f.serial_number, f.type, f.capacity, f.status, c.company_name
                         FROM fire_extinguishers f LEFT JOIN clients c ON f.client_id = c.id
                         WHERE f.client_id = ?"
                    );
                    $stmt->execute([$companyId]);
                } elseif ($start && $end) {
                    $stmt = $db->prepare(
                        "SELECT f.id, f.serial_number, f.type, f.capacity, f.status, c.company_name
                         FROM fire_extinguishers f LEFT JOIN clients c ON f.client_id = c.id
                         WHERE f.created_at BETWEEN :s AND :e ORDER BY f.created_at DESC"
                    );
                    $stmt->bindValue(':s', $start . ' 00:00:00');
                    $stmt->bindValue(':e', $end   . ' 23:59:59');
                    $stmt->execute();
                } else {
                    $stmt = $db->prepare(
                        "SELECT f.id, f.serial_number, f.type, f.capacity, f.status, c.company_name
                         FROM fire_extinguishers f LEFT JOIN clients c ON f.client_id = c.id
                         ORDER BY f.created_at DESC"
                    );
                    $stmt->execute();
                }
                $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
                break;

            case 'orders':
                $title   = 'Orders Report';
                $headers = ['ID', 'Client', 'Status', 'Total (RWF)', 'Date'];
                if ($role === 'Company User' && $companyId) {
                    $stmt = $db->prepare(
                        "SELECT o.id, c.company_name, o.status, o.total_price, DATE(o.created_at) as order_date
                         FROM orders o LEFT JOIN clients c ON o.client_id = c.id
                         WHERE o.client_id = ? ORDER BY o.created_at DESC"
                    );
                    $stmt->execute([$companyId]);
                } elseif ($start && $end) {
                    $stmt = $db->prepare(
                        "SELECT o.id, c.company_name, o.status, o.total_price, DATE(o.created_at) as order_date
                         FROM orders o LEFT JOIN clients c ON o.client_id = c.id
                         WHERE o.created_at BETWEEN :s AND :e ORDER BY o.created_at DESC"
                    );
                    $stmt->bindValue(':s', $start . ' 00:00:00');
                    $stmt->bindValue(':e', $end   . ' 23:59:59');
                    $stmt->execute();
                } else {
                    $stmt = $db->prepare(
                        "SELECT o.id, c.company_name, o.status, o.total_price, DATE(o.created_at) as order_date
                         FROM orders o LEFT JOIN clients c ON o.client_id = c.id
                         ORDER BY o.created_at DESC"
                    );
                    $stmt->execute();
                }
                $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
                break;

            case 'compliance':
                $title   = 'Inspection Compliance Report';
                $headers = ['Ext. ID', 'Serial', 'Type', 'Last Inspection', 'Next Due', 'Status'];
                $stmt    = $db->prepare(
                    "SELECT f.id, f.serial_number, f.type, MAX(i.inspection_date) as last_insp,
                            i.next_due_date, f.status
                     FROM fire_extinguishers f
                     JOIN inspections i ON f.id = i.extinguisher_id
                     GROUP BY f.id
                     HAVING i.next_due_date < CURDATE() OR i.next_due_date IS NULL"
                );
                $stmt->execute();
                $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
                break;

            case 'expired':
                $title   = 'Expired Extinguishers Report';
                $headers = ['ID', 'Serial', 'Type', 'Capacity', 'Expiry Date', 'Client'];
                $stmt    = $db->prepare(
                    "SELECT f.id, f.serial_number, f.type, f.capacity, f.expiry_date, c.company_name
                     FROM fire_extinguishers f LEFT JOIN clients c ON f.client_id = c.id
                     WHERE f.expiry_date < CURDATE() ORDER BY f.expiry_date ASC"
                );
                $stmt->execute();
                $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
                break;

            default:
                return null;
        }

        $filePath = ReportPDFHelper::generate($title, $headers, $data);
        if (!$filePath) return null;

        $reportName = $title . ($start && $end ? " ({$start} to {$end})" : ' - ' . date('Y-m-d'));
        $stmt = $db->prepare(
            "INSERT INTO generated_reports (name, type, file_path, format, start_date, end_date)
             VALUES (?, ?, ?, 'pdf', ?, ?)"
        );
        $stmt->execute([$reportName, $title, $filePath, $start, $end]);

        return ['path' => $filePath, 'title' => $title];
    }

    private function parseDateRange(string $text): array
    {
        $today = new DateTime();

        if (preg_match("/last\s+year'?s?/", $text)) {
            $y = (int) $today->format('Y') - 1;
            return ['start' => "{$y}-01-01", 'end' => "{$y}-12-31"];
        }
        if (preg_match('/this\s+year/', $text)) {
            return ['start' => $today->format('Y') . '-01-01', 'end' => $today->format('Y-m-d')];
        }
        if (preg_match('/last\s+month/', $text)) {
            return [
                'start' => (new DateTime('first day of last month'))->format('Y-m-d'),
                'end'   => (new DateTime('last day of last month'))->format('Y-m-d'),
            ];
        }
        if (preg_match('/this\s+month/', $text)) {
            return ['start' => $today->format('Y-m') . '-01', 'end' => $today->format('Y-m-d')];
        }
        if (preg_match('/last\s+(\d+)\s+(day|week|month)s?/', $text, $m)) {
            $days  = $m[2] === 'week'  ? (int) $m[1] * 7
                   : ($m[2] === 'month' ? (int) $m[1] * 30 : (int) $m[1]);
            $start = (clone $today)->modify("-{$days} days");
            return ['start' => $start->format('Y-m-d'), 'end' => $today->format('Y-m-d')];
        }
        if (preg_match('/since\s+(.+?)(?:\s*$)/i', $text, $m)) {
            $ts = strtotime(trim($m[1]));
            if ($ts) return ['start' => date('Y-m-d', $ts), 'end' => $today->format('Y-m-d')];
        }
        if (preg_match('/from\s+(.+?)\s+(?:to|until)\s+(.+?)(?:\s*$)/i', $text, $m)) {
            $s = strtotime(trim($m[1]));
            $e = strtotime(trim($m[2]));
            if ($s && $e) return ['start' => date('Y-m-d', $s), 'end' => date('Y-m-d', $e)];
        }

        return ['start' => null, 'end' => null];
    }

    // ─────────────────────────────────────────────────────────
    //  Utilities
    // ─────────────────────────────────────────────────────────

    private function defaultSuggestions(string $role): array
    {
        return match ($role) {
            'Super Admin' => ['Show stats', 'Approve clients', 'Add admin', 'Inventory report last month'],
            'Admin'       => ['Show stats', 'Approve orders', 'Check inventory', 'Pending clients'],
            default       => ['Show stats', 'How do I order?', 'Track my orders', 'My extinguishers'],
        };
    }

    private function fallbackReply(string $role): array
    {
        return [
            'reply'       => "I'm having trouble connecting right now. Please try again in a moment, or use the navigation menu to find what you need.",
            'suggestions' => $this->defaultSuggestions($role),
        ];
    }

    private function reply(string $text, array $suggestions = [], ?array $action = null): array
    {
        $out = ['reply' => $text, 'suggestions' => $suggestions];
        if ($action) $out['action'] = $action;
        return $out;
    }
}
