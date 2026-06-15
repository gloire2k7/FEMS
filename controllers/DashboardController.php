<?php

class DashboardController extends Controller
{
    public function stats()
    {
        AuthMiddleware::check();
        $role = $_SESSION['role_name'] ?? '';
        $db = Database::getConnection();

        if ($role === 'Super Admin') {
            $stats = [
                'clients' => (int) $db->query("SELECT COUNT(*) FROM users u JOIN roles r ON r.id=u.role_id WHERE r.name='Company User' AND u.status='active'")->fetchColumn(),
                'pending_clients' => (int) $db->query("SELECT COUNT(*) FROM users u JOIN roles r ON r.id=u.role_id WHERE r.name='Company User' AND u.status='pending'")->fetchColumn(),
                'admins' => (int) $db->query("SELECT COUNT(*) FROM users u JOIN roles r ON r.id=u.role_id WHERE r.name='Admin' AND u.status='active'")->fetchColumn(),
                'extinguishers_in_stock' => (int) $db->query("SELECT COUNT(*) FROM fire_extinguishers WHERE client_id IS NULL AND status='filled'")->fetchColumn(),
                'total_extinguishers' => (int) $db->query("SELECT COUNT(*) FROM fire_extinguishers")->fetchColumn(),
                'pending_orders' => (int) $db->query("SELECT COUNT(*) FROM orders WHERE status='pending'")->fetchColumn(),
                'orders_this_month' => (int) $db->query("SELECT COUNT(*) FROM orders WHERE MONTH(created_at)=MONTH(NOW())")->fetchColumn(),
            ];
            $stats['orders_by_status'] = $db->query(
                "SELECT status, COUNT(*) as count FROM orders GROUP BY status"
            )->fetchAll(PDO::FETCH_ASSOC);
            $stats['stock_by_type'] = $db->query(
                "SELECT type, COUNT(*) as count FROM fire_extinguishers WHERE client_id IS NULL AND status='filled' GROUP BY type"
            )->fetchAll(PDO::FETCH_ASSOC);
            $this->jsonResponse($stats);
        }

        if ($role === 'Admin') {
            $stats = [
                'pending_orders' => (int) $db->query("SELECT COUNT(*) FROM orders WHERE status='pending'")->fetchColumn(),
                'pending_clients' => (int) $db->query("SELECT COUNT(*) FROM users u JOIN roles r ON r.id=u.role_id WHERE r.name='Company User' AND u.status='pending'")->fetchColumn(),
                'extinguishers_in_stock' => (int) $db->query("SELECT COUNT(*) FROM fire_extinguishers WHERE client_id IS NULL AND status='filled'")->fetchColumn(),
                'orders_granted' => (int) $db->query("SELECT COUNT(*) FROM orders WHERE status='granted'")->fetchColumn(),
            ];
            $stats['stock_by_type'] = $db->query(
                "SELECT type, capacity, COUNT(*) as count FROM fire_extinguishers WHERE client_id IS NULL AND status='filled' GROUP BY type, capacity"
            )->fetchAll(PDO::FETCH_ASSOC);
            $stats['orders_by_status'] = $db->query(
                "SELECT status, COUNT(*) as count FROM orders GROUP BY status"
            )->fetchAll(PDO::FETCH_ASSOC);
            $this->jsonResponse($stats);
        }

        // Company User
        $companyId = $_SESSION['company_id'] ?? null;
        if (!$companyId) {
            $this->jsonResponse(['message' => 'No company linked'], 400);
        }
        $stmt = $db->prepare("SELECT COUNT(*) FROM fire_extinguishers WHERE client_id = ?");
        $stmt->execute([$companyId]);
        $units = (int) $stmt->fetchColumn();

        $stmt = $db->prepare("SELECT status, COUNT(*) as count FROM orders WHERE client_id = ? GROUP BY status");
        $stmt->execute([$companyId]);
        $ordersByStatus = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $stmt = $db->prepare("SELECT type, COUNT(*) as count FROM fire_extinguishers WHERE client_id = ? GROUP BY type");
        $stmt->execute([$companyId]);
        $unitsByType = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $this->jsonResponse([
            'my_units' => $units,
            'orders_by_status' => $ordersByStatus,
            'units_by_type' => $unitsByType,
            'pending_orders' => array_sum(array_column(
                array_filter($ordersByStatus, fn($o) => $o['status'] === 'pending'),
                'count'
            )),
        ]);
    }
}
