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

        $message = trim($input['message']);
        $role = $_SESSION['role_name'] ?? 'Guest';
        $userName = $_SESSION['name'] ?? 'there';
        $db = Database::getConnection();

        $context = $this->buildContext($db, $role);
        $result = $this->generateReply($message, $role, $userName, $context);

        $this->jsonResponse($result);
    }

    private function buildContext(PDO $db, string $role): array
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
            $ctx['admins'] = (int) $db->query(
                "SELECT COUNT(*) FROM users u JOIN roles r ON r.id=u.role_id WHERE r.name='Admin' AND u.status='active'"
            )->fetchColumn();
            $ctx['in_stock'] = (int) $db->query(
                "SELECT COUNT(*) FROM fire_extinguishers WHERE client_id IS NULL AND status='filled'"
            )->fetchColumn();
        } elseif ($role === 'Admin') {
            $ctx['pending_orders'] = (int) $db->query("SELECT COUNT(*) FROM orders WHERE status='pending'")->fetchColumn();
            $ctx['pending_clients'] = (int) $db->query(
                "SELECT COUNT(*) FROM users u JOIN roles r ON r.id=u.role_id WHERE r.name='Company User' AND u.status='pending'"
            )->fetchColumn();
            $ctx['in_stock'] = (int) $db->query(
                "SELECT COUNT(*) FROM fire_extinguishers WHERE client_id IS NULL AND status='filled'"
            )->fetchColumn();
        } else {
            $companyId = $_SESSION['company_id'] ?? null;
            if ($companyId) {
                $stmt = $db->prepare("SELECT COUNT(*) FROM fire_extinguishers WHERE client_id = ?");
                $stmt->execute([$companyId]);
                $ctx['my_units'] = (int) $stmt->fetchColumn();

                $stmt = $db->prepare("SELECT status, COUNT(*) as count FROM orders WHERE client_id = ? GROUP BY status");
                $stmt->execute([$companyId]);
                $ctx['orders_by_status'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            }
        }

        return $ctx;
    }

    private function generateReply(string $q, string $role, string $userName, array $ctx): array
    {
        $lower = strtolower($q);
        $first = explode(' ', trim($userName))[0];

        // Greetings
        if (preg_match('/\b(hi|hello|hey|good morning|good afternoon|help)\b/', $lower)) {
            return $this->reply(
                "Hi {$first}! I'm your FEMS assistant. I can help you navigate the portal, explain workflows, and summarize what's pending for you.",
                $this->defaultSuggestions($role)
            );
        }

        // Stats / dashboard
        if (preg_match('/\b(stats|summary|overview|dashboard|how many|status)\b/', $lower)) {
            return $this->statsReply($role, $ctx);
        }

        // Orders
        if (preg_match('/\b(order|orders|purchase|buy|shop)\b/', $lower)) {
            if (preg_match('/\b(approve|grant|review|pending)\b/', $lower)) {
                if ($role === 'Company User') {
                    return $this->reply(
                        'Your orders go to admin for review. Check **My Orders** for pending, approved, or delivered status.',
                        ['Track my orders', 'Browse shop'],
                        ['route' => '/my-orders', 'label' => 'Open My Orders']
                    );
                }
                $n = $ctx['pending_orders'] ?? 0;
                return $this->reply(
                    "There are **{$n} pending order(s)** waiting for review. Open the Orders page to approve or deny each request.",
                    ['How do I approve an order?', 'Show stats'],
                    ['route' => '/admin-orders', 'label' => 'Go to Orders', 'query' => ['status' => 'pending']]
                );
            }
            if ($role === 'Company User') {
                return $this->reply(
                    'Browse the **Shop** to order extinguishers from available stock. After checkout, track progress under **My Orders**.',
                    ['Track my orders', 'What is in stock?'],
                    ['route' => '/shop', 'label' => 'Open Shop']
                );
            }
            return $this->reply(
                'Client orders appear in **Admin Orders**. Approve granted orders, then mark them delivered when fulfilled.',
                ['Approve orders', 'Check inventory'],
                ['route' => '/admin-orders', 'label' => 'View Orders']
            );
        }

        // Stock / inventory
        if (preg_match('/\b(stock|inventory|warehouse|extinguisher|units)\b/', $lower)) {
            if ($role === 'Company User') {
                $units = $ctx['my_units'] ?? 0;
                return $this->reply(
                    "Your company has **{$units} extinguisher unit(s)** registered. View details, locations, and service status under **My Extinguishers**.",
                    ['Order more units', 'Track orders'],
                    ['route' => '/extinguishers', 'label' => 'My Extinguishers']
                );
            }
            $stock = $ctx['in_stock'] ?? 0;
            return $this->reply(
                "The warehouse currently has **{$stock} unit(s)** in stock. Register new units or review levels from **Inventory**.",
                ['Register new units', 'Pending orders'],
                ['route' => '/admin-inventory', 'label' => 'Open Inventory']
            );
        }

        // Clients
        if (preg_match('/\b(client|company|companies|registration|approve client)\b/', $lower)) {
            if ($role === 'Company User') {
                return $this->reply('Client account management is handled by your company admin and FEMS administrators.');
            }
            $n = $ctx['pending_clients'] ?? 0;
            $route = $role === 'Super Admin' ? '/super-admin-clients' : '/clients';
            return $this->reply(
                "**{$n} client registration(s)** are pending approval. Review company details, then approve or reject each one.",
                ['How do I add an admin?', 'Show stats'],
                ['route' => $route, 'label' => 'Review Clients', 'query' => ['tab' => 'pending']]
            );
        }

        // Admins (super admin)
        if (preg_match('/\b(admin|administrator|permission|role)\b/', $lower)) {
            if ($role !== 'Super Admin') {
                return $this->reply('Only Super Admins can create and manage administrator accounts.');
            }
            $n = $ctx['admins'] ?? 0;
            return $this->reply(
                "There are **{$n} active admin(s)** on the platform. Create new admins and assign permissions from **Add Admin**.",
                ['Approve clients', 'Generate report'],
                ['route' => '/super-admin-add-admin', 'label' => 'Add Admin']
            );
        }

        // Password / settings
        if (preg_match('/\b(password|settings|account|profile)\b/', $lower)) {
            $route = $role === 'Super Admin' ? '/super-admin-dashboard' : ($role === 'Admin' ? '/admin-settings' : '/settings');
            return $this->reply(
                'Update your password and account details from **Settings**. Use a strong password you do not reuse elsewhere.',
                ['Show stats', 'Help with orders'],
                ['route' => $route, 'label' => 'Open Settings']
            );
        }

        // Reports
        if (preg_match('/\b(report|export|pdf|csv)\b/', $lower)) {
            if ($role !== 'Super Admin') {
                return $this->reply('Reports are available to Super Admins under the Reports section.');
            }
            return $this->reply(
                'Generate inventory, compliance, or service reports in PDF or CSV. Past reports can be downloaded or exported as a ZIP.',
                ['Platform stats', 'Manage admins'],
                ['route' => '/super-admin-reports', 'label' => 'Open Reports']
            );
        }

        // Notifications
        if (preg_match('/\b(notification|alert|bell)\b/', $lower)) {
            $route = $role === 'Admin' ? '/admin-notifications' : '/notifications';
            return $this->reply(
                'Check your notifications inbox for order updates, client approvals, and stock alerts.',
                ['Show stats', 'Help with orders'],
                ['route' => $route, 'label' => 'View Notifications']
            );
        }

        // Inspections / compliance
        if (preg_match('/\b(inspection|compliance|refill|maintenance)\b/', $lower)) {
            if ($role === 'Company User') {
                return $this->reply(
                    'Request refills or maintenance from your extinguisher list. Inspection reports are under **Reports**.',
                    ['My extinguishers', 'Service requests'],
                    ['route' => '/service-requests', 'label' => 'Service Requests']
                );
            }
            return $this->reply(
                'Manage inspections, compliance alerts, and refills from the **Compliance** and **Refills** sections in the admin sidebar.',
                ['Check inventory', 'Pending orders'],
                ['route' => '/admin-compliance', 'label' => 'Compliance']
            );
        }

        // Locations
        if (preg_match('/\b(location|site|map)\b/', $lower)) {
            if ($role === 'Company User') {
                return $this->reply('View your company sites and unit placement under **Locations**.', [], ['route' => '/locations', 'label' => 'Locations']);
            }
            return $this->reply('Manage client locations and site-level units from **Admin Locations**.', [], ['route' => '/admin-locations', 'label' => 'Locations']);
        }

        return $this->reply(
            "I can help with orders, inventory, clients, navigation, and your dashboard summary. Try asking something like \"What's pending?\" or tap a suggestion below.",
            $this->defaultSuggestions($role)
        );
    }

    private function statsReply(string $role, array $ctx): array
    {
        if ($role === 'Super Admin') {
            $text = sprintf(
                "Platform snapshot:\n• **%d** active clients (%d pending approval)\n• **%d** administrators\n• **%d** pending orders\n• **%d** units in warehouse stock",
                $ctx['clients'] ?? 0,
                $ctx['pending_clients'] ?? 0,
                $ctx['admins'] ?? 0,
                $ctx['pending_orders'] ?? 0,
                $ctx['in_stock'] ?? 0
            );
            return $this->reply($text, ['Approve clients', 'Add admin', 'View reports'], ['route' => '/super-admin-dashboard', 'label' => 'Dashboard']);
        }
        if ($role === 'Admin') {
            $text = sprintf(
                "Operations snapshot:\n• **%d** pending orders\n• **%d** clients awaiting approval\n• **%d** units in stock",
                $ctx['pending_orders'] ?? 0,
                $ctx['pending_clients'] ?? 0,
                $ctx['in_stock'] ?? 0
            );
            return $this->reply($text, ['Approve orders', 'Review clients', 'Check inventory'], ['route' => '/admin-dashboard', 'label' => 'Dashboard']);
        }
        $units = $ctx['my_units'] ?? 0;
        $pending = 0;
        foreach ($ctx['orders_by_status'] ?? [] as $row) {
            if (($row['status'] ?? '') === 'pending') $pending = (int) $row['count'];
        }
        $text = sprintf("Your account:\n• **%d** extinguisher unit(s)\n• **%d** pending order(s)", $units, $pending);
        return $this->reply($text, ['Browse shop', 'Track orders', 'My extinguishers'], ['route' => '/dashboard', 'label' => 'Dashboard']);
    }

    private function defaultSuggestions(string $role): array
    {
        return match ($role) {
            'Super Admin' => ['Show stats', 'Approve clients', 'Add admin', 'Generate report'],
            'Admin' => ['Show stats', 'Approve orders', 'Check inventory', 'Pending clients'],
            default => ['Show stats', 'How do I order?', 'Track my orders', 'My extinguishers'],
        };
    }

    private function reply(string $text, array $suggestions = [], ?array $action = null): array
    {
        $out = [
            'reply' => $text,
            'suggestions' => $suggestions,
        ];
        if ($action) $out['action'] = $action;
        return $out;
    }
}
