<?php

class ComplianceController extends Controller
{
    public function index()
    {
        AuthMiddleware::hasPermission('compliance.view');
        $db = Database::getConnection();
        $today = date('Y-m-d');
        $alerts = [];

        // Expired extinguishers
        $expired = $db->query(
            "SELECT fe.id, fe.serial_number, fe.type, fe.capacity, fe.expiry_date,
                    l.location_name, c.company_name,
                    DATEDIFF(CURDATE(), fe.expiry_date) AS days_overdue
             FROM fire_extinguishers fe
             LEFT JOIN locations l ON l.id = fe.location_id
             LEFT JOIN clients c ON c.id = fe.client_id
             WHERE fe.client_id IS NOT NULL AND fe.expiry_date < CURDATE()
             ORDER BY fe.expiry_date ASC LIMIT 100"
        )->fetchAll(PDO::FETCH_ASSOC);

        foreach ($expired as $row) {
            $days = (int) $row['days_overdue'];
            $alerts[] = [
                'id'             => 'exp-' . $row['id'],
                'extinguisherId' => $row['serial_number'],
                'type'           => $row['type'],
                'capacity'       => $row['capacity'],
                'location'       => $row['location_name'] ?: ($row['company_name'] ?? '—'),
                'urgency'        => 'URGENT',
                'description'    => "Certification expired. Immediate replacement or recertification required for {$row['company_name']}.",
                'timestamp'      => $row['expiry_date'],
                'urgencyDetail'  => "Expired {$days} day" . ($days === 1 ? '' : 's') . ' ago',
                'category'       => 'expiry',
                'link'           => '/admin-view-extinguisher/' . $row['id'],
            ];
        }

        // Expiring within 30 days
        $soon = $db->query(
            "SELECT fe.id, fe.serial_number, fe.type, fe.capacity, fe.expiry_date,
                    l.location_name, c.company_name,
                    DATEDIFF(fe.expiry_date, CURDATE()) AS days_left
             FROM fire_extinguishers fe
             LEFT JOIN locations l ON l.id = fe.location_id
             LEFT JOIN clients c ON c.id = fe.client_id
             WHERE fe.client_id IS NOT NULL
             AND fe.expiry_date >= CURDATE()
             AND fe.expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
             ORDER BY fe.expiry_date ASC LIMIT 100"
        )->fetchAll(PDO::FETCH_ASSOC);

        foreach ($soon as $row) {
            $days = (int) $row['days_left'];
            $urgency = $days <= 7 ? 'HIGH' : 'MEDIUM';
            $alerts[] = [
                'id'             => 'exp-soon-' . $row['id'],
                'extinguisherId' => $row['serial_number'],
                'type'           => $row['type'],
                'capacity'       => $row['capacity'],
                'location'       => $row['location_name'] ?: ($row['company_name'] ?? '—'),
                'urgency'        => $urgency,
                'description'    => "Extinguisher expires on {$row['expiry_date']}. Schedule inspection or replacement.",
                'timestamp'      => $row['expiry_date'],
                'urgencyDetail'  => "{$days} day" . ($days === 1 ? '' : 's') . ' until expiry',
                'category'       => 'expiry_soon',
                'link'           => '/admin-view-extinguisher/' . $row['id'],
            ];
        }

        // Mandatory inspections overdue or near deadline
        $mandatory = $db->query(
            "SELECT mi.id, mi.due_date, mi.deadline_date, mit.name AS mandatory_name,
                    c.company_name, u.name AS inspector_name,
                    DATEDIFF(mi.deadline_date, CURDATE()) AS days_to_deadline
             FROM mandatory_inspection_instances mi
             JOIN mandatory_client_assignments mca ON mca.id = mi.assignment_id
             JOIN mandatory_inspection_types mit ON mit.id = mca.mandatory_type_id
             JOIN clients c ON c.id = mca.client_id
             JOIN users u ON u.id = mca.inspector_id
             WHERE mi.status = 'scheduled'
             AND mi.deadline_date <= DATE_ADD(CURDATE(), INTERVAL 14 DAY)
             ORDER BY mi.deadline_date ASC LIMIT 100"
        )->fetchAll(PDO::FETCH_ASSOC);

        foreach ($mandatory as $row) {
            $days = (int) $row['days_to_deadline'];
            $urgency = $days < 0 ? 'URGENT' : ($days <= 3 ? 'HIGH' : 'MEDIUM');
            $alerts[] = [
                'id'             => 'mand-' . $row['id'],
                'extinguisherId' => $row['mandatory_name'],
                'type'           => 'Mandatory',
                'capacity'       => $row['inspector_name'],
                'location'       => $row['company_name'],
                'urgency'        => $urgency,
                'description'    => "Mandatory inspection \"{$row['mandatory_name']}\" — due {$row['due_date']}, deadline {$row['deadline_date']}.",
                'timestamp'      => $row['deadline_date'],
                'urgencyDetail'  => $days < 0 ? abs($days) . ' days past deadline' : "{$days} days to deadline",
                'category'       => 'mandatory',
                'link'           => '/admin-mandatory-inspections',
            ];
        }

        // Pending client inspection batches
        $pending = $db->query(
            "SELECT b.id, b.preferred_date, b.unit_count, c.company_name, b.created_at
             FROM service_request_batches b
             JOIN clients c ON c.id = b.client_id
             WHERE b.service_type = 'inspection' AND b.status = 'pending'
             ORDER BY b.created_at ASC LIMIT 50"
        )->fetchAll(PDO::FETCH_ASSOC);

        foreach ($pending as $row) {
            $created = substr($row['created_at'], 0, 10);
            $days = (int) floor((strtotime($today) - strtotime($created)) / 86400);
            $alerts[] = [
                'id'             => 'insp-' . $row['id'],
                'extinguisherId' => "Batch #{$row['id']}",
                'type'           => 'Inspection request',
                'capacity'       => $row['unit_count'] . ' units',
                'location'       => $row['company_name'],
                'urgency'        => $days > 7 ? 'HIGH' : 'MEDIUM',
                'description'    => "Client inspection request ({$row['unit_count']} units) awaiting assignment.",
                'timestamp'      => substr($row['created_at'], 0, 10),
                'urgencyDetail'  => $row['preferred_date'] ? "Preferred {$row['preferred_date']}" : 'No preferred date',
                'category'       => 'inspection_pending',
                'link'           => '/admin-assigned-inspections',
            ];
        }

        usort($alerts, function ($a, $b) {
            $order = ['URGENT' => 0, 'HIGH' => 1, 'MEDIUM' => 2];
            return ($order[$a['urgency']] ?? 3) <=> ($order[$b['urgency']] ?? 3);
        });

        $this->jsonResponse([
            'alerts'      => $alerts,
            'urgentCount' => count(array_filter($alerts, fn($a) => $a['urgency'] === 'URGENT')),
            'highCount'   => count(array_filter($alerts, fn($a) => $a['urgency'] === 'HIGH')),
        ]);
    }
}
