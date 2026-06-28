<?php

require_once __DIR__ . '/mail_helper.php';

class NotificationHelper
{
    private static function model()
    {
        return new Notification();
    }

    public static function notify($userId, $type, $title, $message, $link = null, $entityType = null, $entityId = null, $dedupeKey = null)
    {
        return self::model()->create([
            'user_id'     => (int) $userId,
            'type'        => $type,
            'title'       => $title,
            'message'     => $message,
            'link'        => $link,
            'entity_type' => $entityType,
            'entity_id'   => $entityId,
            'dedupe_key'  => $dedupeKey,
        ]);
    }

    public static function notifySuperAdmins($type, $title, $message, $link = null, $entityType = null, $entityId = null, $dedupeKey = null)
    {
        $db = Database::getConnection();
        $users = $db->query(
            "SELECT u.id FROM users u JOIN roles r ON r.id = u.role_id
             WHERE r.name = 'Super Admin' AND u.status = 'active'"
        )->fetchAll(PDO::FETCH_COLUMN);
        foreach ($users as $uid) {
            self::notify($uid, $type, $title, $message, $link, $entityType, $entityId, $dedupeKey ? "{$dedupeKey}:sa:{$uid}" : null);
        }
    }

    public static function notifyByPermission($permissionKey, $type, $title, $message, $link = null, $entityType = null, $entityId = null, $dedupeKey = null)
    {
        $db = Database::getConnection();
        $stmt = $db->prepare(
            "SELECT DISTINCT u.id FROM users u
             JOIN roles r ON r.id = u.role_id
             LEFT JOIN user_permissions up ON up.user_id = u.id
             LEFT JOIN permissions p ON p.id = up.permission_id
             WHERE u.status = 'active'
             AND (r.name = 'Super Admin' OR p.`key` = :perm)"
        );
        $stmt->execute([':perm' => $permissionKey]);
        foreach ($stmt->fetchAll(PDO::FETCH_COLUMN) as $uid) {
            $key = $dedupeKey ? "{$dedupeKey}:perm:{$uid}" : null;
            self::notify($uid, $type, $title, $message, $link, $entityType, $entityId, $key);
        }
    }

    public static function notifyCompanyUsers($clientId, $type, $title, $message, $link = null, $entityType = null, $entityId = null, $dedupeKey = null)
    {
        $db = Database::getConnection();
        $stmt = $db->prepare(
            "SELECT u.id FROM users u
             JOIN roles r ON r.id = u.role_id
             WHERE r.name = 'Company User' AND u.company_id = :cid AND u.status = 'active'"
        );
        $stmt->execute([':cid' => (int) $clientId]);
        foreach ($stmt->fetchAll(PDO::FETCH_COLUMN) as $uid) {
            $key = $dedupeKey ? "{$dedupeKey}:client:{$uid}" : null;
            self::notify($uid, $type, $title, $message, $link, $entityType, $entityId, $key);
        }
    }

    public static function notifyInspector($inspectorId, $type, $title, $message, $link = null, $entityType = null, $entityId = null, $dedupeKey = null)
    {
        self::notify($inspectorId, $type, $title, $message, $link, $entityType, $entityId, $dedupeKey);
    }

    /** Sync time-based alerts (delivery reminders, expiry warnings, mandatory deadlines). */
    public static function syncScheduledAlerts()
    {
        $db = Database::getConnection();
        $today = date('Y-m-d');
        $tomorrow = date('Y-m-d', strtotime('+1 day'));
        $inFiveDays = date('Y-m-d', strtotime('+5 days'));

        // Order delivery due tomorrow — granted but not delivered
        $orders = $db->prepare(
            "SELECT o.*, c.company_name FROM orders o
             JOIN clients c ON c.id = o.client_id
             WHERE o.status = 'granted' AND o.expected_delivery_date = ?"
        );
        $orders->execute([$tomorrow]);
        foreach ($orders->fetchAll(PDO::FETCH_ASSOC) as $order) {
            $dedupe = "order_delivery_reminder:{$order['id']}:{$tomorrow}";
            self::notifySuperAdmins('warning', 'Delivery due tomorrow',
                "Order #{$order['id']} for {$order['company_name']} is due tomorrow and not yet marked delivered.",
                '/admin-orders', 'order', (int) $order['id'], "{$dedupe}:sa");
            self::notifyByPermission('manage_orders', 'warning', 'Delivery due tomorrow',
                "Order #{$order['id']} for {$order['company_name']} is due tomorrow.",
                '/admin-orders', 'order', (int) $order['id'], "{$dedupe}:admin");
            self::notifyCompanyUsers((int) $order['client_id'], 'warning', 'Delivery expected tomorrow',
                "Your order #{$order['id']} is scheduled for delivery tomorrow. Confirm receipt once it arrives.",
                '/my-orders', 'order', (int) $order['id'], "{$dedupe}:client");
        }

        // Extinguisher expiring in 5 days — client users
        $expiring = $db->prepare(
            "SELECT fe.*, c.company_name FROM fire_extinguishers fe
             JOIN clients c ON c.id = fe.client_id
             WHERE fe.client_id IS NOT NULL AND fe.expiry_date = ?"
        );
        $expiring->execute([$inFiveDays]);
        foreach ($expiring->fetchAll(PDO::FETCH_ASSOC) as $ext) {
            $dedupe = "ext_expiry_5d:{$ext['id']}:{$inFiveDays}";
            self::notifyCompanyUsers((int) $ext['client_id'], 'warning', 'Extinguisher expiring soon',
                "Unit {$ext['serial_number']} expires in 5 days ({$ext['expiry_date']}). Plan replacement or service.",
                '/view-extinguisher/' . urlencode($ext['serial_number']), 'extinguisher', (int) $ext['id'], "{$dedupe}:client");
            self::notifyByPermission('manage_inspections', 'info', 'Unit expiring soon',
                "{$ext['serial_number']} ({$ext['company_name']}) expires in 5 days.",
                '/admin-view-extinguisher/' . $ext['id'], 'extinguisher', (int) $ext['id'], "{$dedupe}:insp_admin");
        }

        // Mandatory inspection deadlines passed or due within 3 days
        $mandatory = $db->query(
            "SELECT mi.*, mit.name AS mandatory_name, mca.inspector_id, mca.client_id, c.company_name
             FROM mandatory_inspection_instances mi
             JOIN mandatory_client_assignments mca ON mca.id = mi.assignment_id
             JOIN mandatory_inspection_types mit ON mit.id = mca.mandatory_type_id
             JOIN clients c ON c.id = mca.client_id
             WHERE mi.status = 'scheduled'
             AND (mi.deadline_date <= DATE_ADD(CURDATE(), INTERVAL 3 DAY))"
        )->fetchAll(PDO::FETCH_ASSOC);
        foreach ($mandatory as $mi) {
            $urgency = ($mi['deadline_date'] < $today) ? 'critical' : 'warning';
            $dedupe = "mandatory_due:{$mi['id']}:{$today}";
            self::notifyInspector((int) $mi['inspector_id'], $urgency, 'Mandatory inspection due',
                "{$mi['mandatory_name']} at {$mi['company_name']} — deadline {$mi['deadline_date']}.",
                '/inspector-mandatory-inspections', 'mandatory', (int) $mi['id'], "{$dedupe}:inspector");
            self::notifyByPermission('manage_inspections', $urgency, 'Mandatory inspection deadline',
                "{$mi['mandatory_name']} for {$mi['company_name']} — deadline {$mi['deadline_date']}.",
                '/admin-mandatory-inspections', 'mandatory', (int) $mi['id'], "{$dedupe}:admin");
        }
    }

    public static function sendMandatoryAssignmentEmails(array $assignment)
    {
        $inspectorEmail = $assignment['inspector_email'] ?? null;
        $clientEmail = $assignment['client_email'] ?? null;

        if (empty($inspectorEmail) && !empty($assignment['inspector_id'])) {
            $user = (new User())->findById((int) $assignment['inspector_id']);
            $inspectorEmail = $user['email'] ?? null;
        }
        if (empty($clientEmail) && !empty($assignment['client_id'])) {
            $db = Database::getConnection();
            $stmt = $db->prepare("SELECT email FROM clients WHERE id = ?");
            $stmt->execute([(int) $assignment['client_id']]);
            $clientEmail = $stmt->fetchColumn() ?: null;
            if (!$clientEmail) {
                $stmt = $db->prepare(
                    "SELECT u.email FROM users u JOIN roles r ON r.id = u.role_id
                     WHERE u.company_id = ? AND r.name = 'Company User' AND u.status = 'active' LIMIT 1"
                );
                $stmt->execute([(int) $assignment['client_id']]);
                $clientEmail = $stmt->fetchColumn() ?: null;
            }
        }

        $assignment['inspector_email'] = $inspectorEmail;
        $assignment['client_email'] = $clientEmail;

        return MailHelper::sendMandatoryAssignmentNotice($assignment);
    }
}
