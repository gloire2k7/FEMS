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
        $userName    = $_SESSION['name']     ?? 'there';
        $permissions = $_SESSION['permissions'] ?? [];
        $companyId   = isset($_SESSION['company_id']) ? (int) $_SESSION['company_id'] : null;
        $db          = Database::getConnection();

        $context = $this->buildContext($db, $role, $permissions, $companyId);
        $result  = $this->generateReply($message, $role, $userName, $context, $permissions, $db, $companyId);

        $this->jsonResponse($result);
    }

    // ─────────────────────────────────────────────────────────
    //  Context builder — only fetches data the caller can see
    // ─────────────────────────────────────────────────────────

    private function buildContext(PDO $db, string $role, array $permissions, ?int $companyId): array
    {
        $ctx = ['role' => $role];

        if ($role === 'Super Admin') {
            $ctx['clients'] = (int) $db->query(
                "SELECT COUNT(*) FROM users u JOIN roles r ON r.id=u.role_id WHERE r.name='Company User' AND u.status='active'"
            )->fetchColumn();
            $ctx['pending_clients'] = (int) $db->query(
                "SELECT COUNT(*) FROM users u JOIN roles r ON r.id=u.role_id WHERE r.name='Company User' AND u.status='pending'"
            )->fetchColumn();
            $ctx['pending_orders'] = (int) $db->query("SELECT COUNT(*) FROM orders WHERE status='pending'")->fetchColumn();
            $ctx['admins']  = (int) $db->query(
                "SELECT COUNT(*) FROM users u JOIN roles r ON r.id=u.role_id WHERE r.name='Admin' AND u.status='active'"
            )->fetchColumn();
            $ctx['in_stock'] = (int) $db->query(
                "SELECT COUNT(*) FROM fire_extinguishers WHERE client_id IS NULL AND status='filled'"
            )->fetchColumn();

        } elseif ($role === 'Admin') {
            if (in_array('manage_orders', $permissions, true)) {
                $ctx['pending_orders'] = (int) $db->query("SELECT COUNT(*) FROM orders WHERE status='pending'")->fetchColumn();
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

                $s = $db->prepare("SELECT status, COUNT(*) as count FROM orders WHERE client_id = ? GROUP BY status");
                $s->execute([$companyId]);
                $ctx['orders_by_status'] = $s->fetchAll(PDO::FETCH_ASSOC);
            }
        }

        return $ctx;
    }

    // ─────────────────────────────────────────────────────────
    //  Main reply router
    // ─────────────────────────────────────────────────────────

    private function generateReply(
        string $q, string $role, string $userName,
        array $ctx, array $permissions, PDO $db, ?int $companyId
    ): array {
        $lower = strtolower($q);
        $first = explode(' ', trim($userName))[0];

        // ── Report / PDF generation request ──────────────────────
        if ($this->isReportRequest($lower) && !$this->isExplanationQuery($lower)) {
            return $this->handleReportRequest($lower, $role, $permissions, $db, $companyId);
        }

        // ── Greetings ────────────────────────────────────────────
        if (preg_match('/\b(hi|hello|hey|good\s+morning|good\s+afternoon|help)\b/', $lower)) {
            return $this->reply(
                "Hi {$first}! I'm your FEMS assistant. I can help you navigate the portal, explain workflows, and generate PDF reports based on your **{$role}** access.",
                $this->defaultSuggestions($role)
            );
        }

        // ── Stats / dashboard ─────────────────────────────────────
        if (preg_match('/\b(stats|summary|overview|dashboard|how many|status)\b/', $lower)) {
            return $this->statsReply($role, $ctx, $permissions);
        }

        // ── Orders ────────────────────────────────────────────────
        if (preg_match('/\b(order|orders|purchase|buy|shop)\b/', $lower)) {
            if ($role === 'Company User' && preg_match('/\b(all|everyone|other|global|total)\b/', $lower)) {
                return $this->reply('You can only view your own orders. Navigate to **My Orders** to track your requests.', ['Track my orders', 'Browse shop'], ['route' => '/my-orders', 'label' => 'My Orders']);
            }
            if ($role === 'Company User') {
                if (preg_match('/\b(approve|grant|review)\b/', $lower)) {
                    return $this->reply('Your orders are reviewed by an administrator. Check **My Orders** for the current status of each request.', ['Track my orders', 'Browse shop'], ['route' => '/my-orders', 'label' => 'Open My Orders']);
                }
                return $this->reply(
                    'Browse the **Shop** to order extinguishers from available stock. After checkout, track progress under **My Orders**.',
                    ['Track my orders', 'What is in stock?'],
                    ['route' => '/shop', 'label' => 'Open Shop']
                );
            }
            if ($role === 'Admin' && !in_array('manage_orders', $permissions, true)) {
                if ($this->isExplanationQuery($lower)) {
                    return $this->reply(
                        'The **Orders** module lets admins review client purchase requests, grant or deny them, and mark them delivered once fulfilled. Clients place orders via the Shop.',
                        ['How does inventory work?', 'What is compliance?']
                    );
                }
                return $this->reply("You don't have permission to access order data. Contact your Super Admin to request **Orders Management** access.");
            }
            if (preg_match('/\b(approve|grant|review|pending)\b/', $lower)) {
                $n = $ctx['pending_orders'] ?? 0;
                return $this->reply(
                    "There are **{$n} pending order(s)** awaiting review. Open Orders to approve or deny each request.",
                    ['How do I approve an order?', 'Show stats'],
                    ['route' => '/admin-orders', 'label' => 'Go to Orders', 'query' => ['status' => 'pending']]
                );
            }
            return $this->reply(
                'Client orders appear in **Admin Orders**. Approve or deny each request, then mark approved orders as delivered once fulfilled.',
                ['Approve orders', 'Check inventory'],
                ['route' => '/admin-orders', 'label' => 'View Orders']
            );
        }

        // ── Stock / inventory ─────────────────────────────────────
        if (preg_match('/\b(stock|inventory|warehouse|extinguisher|units)\b/', $lower)) {
            if ($role === 'Company User') {
                if (preg_match('/\b(all|everyone|other|global|total\s+stock|warehouse|admin)\b/', $lower)) {
                    return $this->reply("You don't have access to the warehouse inventory. You can only view your own assigned extinguisher units.");
                }
                $units = $ctx['my_units'] ?? 0;
                return $this->reply(
                    "Your company has **{$units} extinguisher unit(s)** registered. View details, locations, and service status under **My Extinguishers**.",
                    ['Order more units', 'Track orders'],
                    ['route' => '/extinguishers', 'label' => 'My Extinguishers']
                );
            }
            if ($role === 'Admin' && !in_array('manage_inventory', $permissions, true)) {
                if ($this->isExplanationQuery($lower)) {
                    return $this->reply(
                        'The **Inventory** module tracks all fire extinguisher units in the FEMS warehouse. Admins with inventory permission can register new units (with auto-generated QR codes), filter by status — In Stock or Allocated to a client — sort by date, and view detailed unit information.',
                        ['How do orders work?', 'What is compliance?']
                    );
                }
                return $this->reply("You don't have permission to access inventory data. Contact your Super Admin to request **Inventory Management** access.");
            }
            $stock = $ctx['in_stock'] ?? 0;
            return $this->reply(
                "The warehouse currently has **{$stock} unit(s)** in stock. Register new units or review levels from **Inventory**.",
                ['Register new units', 'Pending orders'],
                ['route' => '/admin-inventory', 'label' => 'Open Inventory']
            );
        }

        // ── Clients ───────────────────────────────────────────────
        if (preg_match('/\b(client|company|companies|registration|approve\s+client)\b/', $lower)) {
            if ($role === 'Company User') {
                return $this->reply("You can't access other clients' data. Client account management is handled by FEMS administrators only.");
            }
            if ($role === 'Admin' && !in_array('manage_clients', $permissions, true)) {
                if ($this->isExplanationQuery($lower)) {
                    return $this->reply(
                        'Companies register through the FEMS portal and wait for an admin with client management permission to approve their account. Once approved, they can browse the shop and place orders.',
                        ['How do orders work?', 'Show stats']
                    );
                }
                return $this->reply("You don't have permission to manage clients. Contact your Super Admin to request **Clients Management** access.");
            }
            $n = $ctx['pending_clients'] ?? 0;
            $route = $role === 'Super Admin' ? '/super-admin-clients' : '/clients';
            return $this->reply(
                "**{$n} client registration(s)** are pending approval. Review their company details, then approve or reject.",
                ['How do I add an admin?', 'Show stats'],
                ['route' => $route, 'label' => 'Review Clients', 'query' => ['tab' => 'pending']]
            );
        }

        // ── Admins (super admin only) ──────────────────────────────
        if (preg_match('/\b(admin|administrator|permission|role)\b/', $lower)) {
            if ($role !== 'Super Admin') {
                return $this->reply('Only Super Admins can create and manage administrator accounts. If you need a permission added to your account, contact your Super Admin.');
            }
            $n = $ctx['admins'] ?? 0;
            return $this->reply(
                "There are **{$n} active admin(s)** on the platform. Create new admins and assign granular permissions from **Add Admin**.",
                ['Approve clients', 'Inventory report'],
                ['route' => '/super-admin-add-admin', 'label' => 'Add Admin']
            );
        }

        // ── Password / settings ───────────────────────────────────
        if (preg_match('/\b(password|settings|account|profile)\b/', $lower)) {
            $route = $role === 'Super Admin' ? '/super-admin-dashboard'
                   : ($role === 'Admin' ? '/admin-settings' : '/settings');
            return $this->reply(
                'Update your password and account details from **Settings**. Use a strong password that you don\'t reuse elsewhere.',
                ['Show stats', 'Help with orders'],
                ['route' => $route, 'label' => 'Open Settings']
            );
        }

        // ── Reports (nav / explanation) ───────────────────────────
        if (preg_match('/\b(report|export|pdf|csv)\b/', $lower)) {
            if ($role === 'Company User') {
                return $this->reply(
                    "I can generate a PDF of your own orders or your assigned extinguishers.\nTry:\n• \"Generate my orders report\"\n• \"Make a PDF of my extinguishers\"",
                    ['Generate my orders report', 'My extinguishers PDF']
                );
            }
            return $this->reply(
                "I can generate PDF reports for you! Try:\n• \"Make an inventory report since June 2026\"\n• \"Generate an orders report for last month\"\n• \"Create a compliance report for last year\"\n• \"Expired units report\"",
                ['Inventory report last month', 'Orders report', 'Compliance report', 'Expired units report'],
                ['route' => '/super-admin-reports', 'label' => 'View all reports']
            );
        }

        // ── Notifications ─────────────────────────────────────────
        if (preg_match('/\b(notification|alert|bell)\b/', $lower)) {
            $route = $role === 'Admin' ? '/admin-notifications' : '/notifications';
            return $this->reply(
                'Check your notifications inbox for order updates, client approvals, and stock alerts.',
                ['Show stats', 'Help with orders'],
                ['route' => $route, 'label' => 'View Notifications']
            );
        }

        // ── Inspections / compliance ──────────────────────────────
        if (preg_match('/\b(inspection|compliance|refill|maintenance)\b/', $lower)) {
            if ($role === 'Company User') {
                return $this->reply(
                    'Request refills or maintenance from your extinguisher list. Inspection records can be downloaded from the extinguisher detail page.',
                    ['My extinguishers', 'Service requests'],
                    ['route' => '/service-requests', 'label' => 'Service Requests']
                );
            }
            if ($role === 'Admin' && !in_array('manage_inspections', $permissions, true) && !$this->isExplanationQuery($lower)) {
                return $this->reply("You don't have permission to manage inspections. Contact your Super Admin to request **Inspections Management** access.");
            }
            return $this->reply(
                'Manage inspections, compliance alerts, and refill requests from the **Compliance** and **Refills** sections in the admin sidebar.',
                ['Check inventory', 'Pending orders'],
                ['route' => '/admin-compliance', 'label' => 'Compliance']
            );
        }

        // ── Locations ─────────────────────────────────────────────
        if (preg_match('/\b(location|site|map)\b/', $lower)) {
            if ($role === 'Admin' && !in_array('manage_locations', $permissions, true) && !$this->isExplanationQuery($lower)) {
                return $this->reply("You don't have permission to manage locations. Contact your Super Admin to request **Location Management** access.");
            }
            if ($role === 'Company User') {
                return $this->reply('View your company sites and extinguisher placement under **Locations**.', [], ['route' => '/locations', 'label' => 'Locations']);
            }
            return $this->reply('Manage client locations and site-level units from **Admin Locations**.', [], ['route' => '/admin-locations', 'label' => 'Locations']);
        }

        // ── Fallback ──────────────────────────────────────────────
        return $this->reply(
            "I can help with orders, inventory, clients, navigation, and generating PDF reports. Try asking something like \"What's pending?\" or tap a suggestion below.",
            $this->defaultSuggestions($role)
        );
    }

    // ─────────────────────────────────────────────────────────
    //  Report generation
    // ─────────────────────────────────────────────────────────

    private function isReportRequest(string $lower): bool
    {
        $hasGenerate = (bool) preg_match('/\b(generate|make|create|produce|export|build|give\s+me|can\s+you)\b.{0,40}\b(report|pdf)\b/i', $lower);
        $hasTypeReport = (bool) preg_match('/\b(inventory|orders?|compliance|inspection|expired|expiry)\s+report\b/i', $lower);
        return $hasGenerate || $hasTypeReport;
    }

    private function isExplanationQuery(string $lower): bool
    {
        return (bool) preg_match('/\b(how\s+does|what\s+is|explain|how\s+to|guide|tell\s+me\s+about|what\s+should|walkthrough|describe)\b/', $lower);
    }

    private function handleReportRequest(string $lower, string $role, array $permissions, PDO $db, ?int $companyId): array
    {
        // Detect report type from the message
        $type = 'inventory';
        if (preg_match('/\b(order|orders|purchases?)\b/', $lower)) $type = 'orders';
        if (preg_match('/\b(compliance|inspection|inspections)\b/', $lower)) $type = 'compliance';
        if (preg_match('/\b(expired|expiry|expiring)\b/', $lower)) $type = 'expired';

        // Permission gate
        if ($role === 'Company User') {
            if (!in_array($type, ['orders', 'inventory'])) {
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

        // Parse date range from message
        $dates = $this->parseDateRange($lower);

        // Generate PDF
        $result = $this->generateReportPdf($type, $dates['start'], $dates['end'], $db, $role, $companyId);

        if (!$result) {
            return $this->reply(
                'Sorry, I encountered an error generating the report. Please try using the **Reports** page directly.',
                [],
                ['route' => '/super-admin-reports', 'label' => 'Reports page']
            );
        }

        $fileUrl   = 'http://localhost:8000' . $result['path'];
        $dateLabel = ($dates['start'] && $dates['end'])
            ? " ({$dates['start']} to {$dates['end']})"
            : '';

        return $this->reply(
            "Your **{$result['title']}{$dateLabel}** PDF is ready. Download it below — you'll also find it in the **Reports** page for future reference.",
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

        // Save to the reports log so it appears in the Reports page
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

        // "last year" / "last year's"
        if (preg_match("/last\s+year'?s?/", $text)) {
            $y = (int) $today->format('Y') - 1;
            return ['start' => "{$y}-01-01", 'end' => "{$y}-12-31"];
        }
        // "this year"
        if (preg_match('/this\s+year/', $text)) {
            return ['start' => $today->format('Y') . '-01-01', 'end' => $today->format('Y-m-d')];
        }
        // "last month"
        if (preg_match('/last\s+month/', $text)) {
            return [
                'start' => (new DateTime('first day of last month'))->format('Y-m-d'),
                'end'   => (new DateTime('last day of last month'))->format('Y-m-d'),
            ];
        }
        // "this month"
        if (preg_match('/this\s+month/', $text)) {
            return ['start' => $today->format('Y-m') . '-01', 'end' => $today->format('Y-m-d')];
        }
        // "last N days / weeks / months"
        if (preg_match('/last\s+(\d+)\s+(day|week|month)s?/', $text, $m)) {
            $days  = $m[2] === 'week'  ? (int)$m[1] * 7
                   : ($m[2] === 'month' ? (int)$m[1] * 30 : (int)$m[1]);
            $start = (clone $today)->modify("-{$days} days");
            return ['start' => $start->format('Y-m-d'), 'end' => $today->format('Y-m-d')];
        }
        // "since DATE" (e.g. "since 11 June 2026", "since June 2026", "since 2025-01-01")
        if (preg_match('/since\s+(.+?)(?:\s*$)/i', $text, $m)) {
            $ts = strtotime(trim($m[1]));
            if ($ts) {
                return ['start' => date('Y-m-d', $ts), 'end' => $today->format('Y-m-d')];
            }
        }
        // "from DATE to DATE"
        if (preg_match('/from\s+(.+?)\s+(?:to|until)\s+(.+?)(?:\s*$)/i', $text, $m)) {
            $s = strtotime(trim($m[1]));
            $e = strtotime(trim($m[2]));
            if ($s && $e) {
                return ['start' => date('Y-m-d', $s), 'end' => date('Y-m-d', $e)];
            }
        }

        return ['start' => null, 'end' => null];
    }

    // ─────────────────────────────────────────────────────────
    //  Stats reply
    // ─────────────────────────────────────────────────────────

    private function statsReply(string $role, array $ctx, array $permissions): array
    {
        if ($role === 'Super Admin') {
            $text = sprintf(
                "Platform snapshot:\n• **%d** active clients (%d pending approval)\n• **%d** administrators\n• **%d** pending orders\n• **%d** units in warehouse stock",
                $ctx['clients'] ?? 0, $ctx['pending_clients'] ?? 0,
                $ctx['admins'] ?? 0, $ctx['pending_orders'] ?? 0, $ctx['in_stock'] ?? 0
            );
            return $this->reply($text, ['Approve clients', 'Add admin', 'Inventory report'], ['route' => '/super-admin-dashboard', 'label' => 'Dashboard']);
        }

        if ($role === 'Admin') {
            $lines = [];
            if (isset($ctx['pending_orders']))  $lines[] = "**{$ctx['pending_orders']}** pending orders";
            if (isset($ctx['pending_clients'])) $lines[] = "**{$ctx['pending_clients']}** clients awaiting approval";
            if (isset($ctx['in_stock']))        $lines[] = "**{$ctx['in_stock']}** units in stock";
            if (!$lines) {
                return $this->reply(
                    "Your account doesn't have module permissions assigned yet. The stats you can access depend on what your Super Admin has granted you.",
                    ['How does inventory work?', 'How do orders work?']
                );
            }
            $text = "Operations snapshot:\n• " . implode("\n• ", $lines);
            return $this->reply($text, ['Approve orders', 'Review clients', 'Check inventory'], ['route' => '/admin-dashboard', 'label' => 'Dashboard']);
        }

        // Company User
        $units   = $ctx['my_units'] ?? 0;
        $pending = 0;
        foreach ($ctx['orders_by_status'] ?? [] as $row) {
            if (($row['status'] ?? '') === 'pending') $pending = (int) $row['count'];
        }
        $text = sprintf("Your account:\n• **%d** extinguisher unit(s) assigned\n• **%d** pending order(s)", $units, $pending);
        return $this->reply($text, ['Browse shop', 'Track orders', 'My extinguishers'], ['route' => '/dashboard', 'label' => 'Dashboard']);
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

    private function reply(string $text, array $suggestions = [], ?array $action = null): array
    {
        $out = ['reply' => $text, 'suggestions' => $suggestions];
        if ($action) $out['action'] = $action;
        return $out;
    }
}
