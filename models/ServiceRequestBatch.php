<?php

class ServiceRequestBatch extends Model
{
    protected $table = 'service_request_batches';

    private function baseSelect()
    {
        return "SELECT b.*, c.company_name, ui.name AS inspector_name
                FROM {$this->table} b
                JOIN clients c ON c.id = b.client_id
                LEFT JOIN users ui ON ui.id = b.inspector_id";
    }

    public function create($data)
    {
        $stmt = $this->db->prepare(
            "INSERT INTO {$this->table}
            (client_id, service_type, preferred_date, client_notes, unit_count, status)
            VALUES (:client_id, :service_type, :preferred_date, :client_notes, :unit_count, 'pending')"
        );
        $stmt->bindValue(':client_id', (int) $data['client_id'], PDO::PARAM_INT);
        $stmt->bindValue(':service_type', $data['service_type']);
        $stmt->bindValue(':preferred_date', $data['preferred_date'] ?? null);
        $stmt->bindValue(':client_notes', $data['client_notes'] ?? null);
        $stmt->bindValue(':unit_count', (int) ($data['unit_count'] ?? 0), PDO::PARAM_INT);
        return $stmt->execute() ? (int) $this->db->lastInsertId() : false;
    }

    public function findById($id)
    {
        $stmt = $this->db->prepare($this->baseSelect() . " WHERE b.id = :id LIMIT 1");
        $stmt->bindValue(':id', (int) $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function getItems($batchId)
    {
        $stmt = $this->db->prepare(
            "SELECT sr.*, fe.serial_number, fe.type, fe.capacity, l.location_name, ia.id AS assignment_id
             FROM service_requests sr
             JOIN fire_extinguishers fe ON fe.id = sr.extinguisher_id
             LEFT JOIN locations l ON l.id = fe.location_id
             LEFT JOIN inspection_assignments ia ON ia.service_request_id = sr.id
             WHERE sr.batch_id = :batch_id
             ORDER BY fe.serial_number"
        );
        $stmt->bindValue(':batch_id', (int) $batchId, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findPaginatedByClient($clientId, $page, $limit, $type = null)
    {
        $offset = ($page - 1) * $limit;
        $where = 'b.client_id = :client_id';
        $params = [':client_id' => (int) $clientId];
        if ($type && in_array($type, ['inspection', 'refill', 'maintenance', 'mandatory'], true)) {
            if ($type === 'mandatory') {
                $where .= " AND b.service_type = 'inspection' AND b.id IN (
                    SELECT batch_id FROM service_requests WHERE service_type = 'mandatory' AND batch_id IS NOT NULL
                )";
            } else {
                $where .= ' AND b.service_type = :type';
                $params[':type'] = $type;
            }
        }

        $countStmt = $this->db->prepare("SELECT COUNT(*) FROM {$this->table} b WHERE $where");
        foreach ($params as $k => $v) {
            $countStmt->bindValue($k, $v);
        }
        $countStmt->execute();
        $total = (int) $countStmt->fetchColumn();

        $query = $this->baseSelect() . " WHERE $where ORDER BY b.created_at DESC LIMIT :limit OFFSET :offset";
        $stmt = $this->db->prepare($query);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue(':limit', (int) $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int) $offset, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as &$row) {
            $row['items'] = $this->getItems($row['id']);
            $row['is_mandatory'] = $this->batchHasMandatory($row['id']);
        }
        return [
            'data'      => $rows,
            'total'     => $total,
            'page'      => (int) $page,
            'last_page' => max(1, (int) ceil($total / $limit)),
        ];
    }

    public function batchHasMandatory($batchId)
    {
        $stmt = $this->db->prepare(
            "SELECT COUNT(*) FROM service_requests WHERE batch_id = ? AND service_type = 'mandatory'"
        );
        $stmt->execute([(int) $batchId]);
        return (int) $stmt->fetchColumn() > 0;
    }

    public function findPaginatedForAdmin($types, $page, $limit, $status = null)
    {
        $offset = ($page - 1) * $limit;
        $placeholders = implode(',', array_fill(0, count($types), '?'));
        $where = "b.service_type IN ($placeholders)";
        $params = $types;
        if ($status && in_array($status, ['pending', 'scheduled', 'awaiting_client', 'completed'], true)) {
            $where .= ' AND b.status = ?';
            $params[] = $status;
        } else {
            $where .= " AND b.status != 'cancelled'";
        }

        $countStmt = $this->db->prepare("SELECT COUNT(*) FROM {$this->table} b WHERE $where");
        $countStmt->execute($params);
        $total = (int) $countStmt->fetchColumn();

        $query = $this->baseSelect() . " WHERE $where ORDER BY FIELD(b.status,'pending','scheduled','awaiting_client','completed'), b.created_at DESC LIMIT ? OFFSET ?";
        $stmt = $this->db->prepare($query);
        $i = 1;
        foreach ($params as $p) {
            $stmt->bindValue($i++, $p);
        }
        $stmt->bindValue($i++, (int) $limit, PDO::PARAM_INT);
        $stmt->bindValue($i, (int) $offset, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as &$row) {
            $row['items'] = $this->getItems($row['id']);
        }
        return [
            'data'      => $rows,
            'total'     => $total,
            'page'      => (int) $page,
            'last_page' => max(1, (int) ceil($total / $limit)),
        ];
    }

    public function scheduleInspection($batchId, $inspectorId, $assignedBy, $confirmedDate)
    {
        $stmt = $this->db->prepare(
            "UPDATE {$this->table} SET inspector_id = :inspector_id, assigned_by = :assigned_by,
             confirmed_date = :confirmed_date, status = 'scheduled'
             WHERE id = :id AND service_type = 'inspection' AND status = 'pending'"
        );
        $stmt->bindValue(':inspector_id', (int) $inspectorId, PDO::PARAM_INT);
        $stmt->bindValue(':assigned_by', (int) $assignedBy, PDO::PARAM_INT);
        $stmt->bindValue(':confirmed_date', $confirmedDate);
        $stmt->bindValue(':id', (int) $batchId, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }

    public function syncStatusFromItems($batchId)
    {
        $items = $this->getItems($batchId);
        if (!$items) {
            return;
        }
        $statuses = array_column($items, 'status');
        if (count(array_unique($statuses)) === 1) {
            $this->updateStatus($batchId, $statuses[0]);
            return;
        }
        if (in_array('awaiting_client', $statuses, true)) {
            $this->updateStatus($batchId, 'awaiting_client');
        } elseif (in_array('scheduled', $statuses, true)) {
            $this->updateStatus($batchId, 'scheduled');
        }
    }

    public function updateStatus($batchId, $status)
    {
        $stmt = $this->db->prepare("UPDATE {$this->table} SET status = :status WHERE id = :id");
        $stmt->bindValue(':status', $status);
        $stmt->bindValue(':id', (int) $batchId, PDO::PARAM_INT);
        $stmt->execute();
    }

    public function markAwaitingClient($batchId)
    {
        $stmt = $this->db->prepare(
            "UPDATE {$this->table} SET status = 'awaiting_client' WHERE id = :id AND status = 'scheduled'"
        );
        $stmt->bindValue(':id', (int) $batchId, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }

    public function clientConfirmDone($batchId, $clientId)
    {
        $stmt = $this->db->prepare(
            "UPDATE {$this->table} SET status = 'completed'
             WHERE id = :id AND client_id = :client_id AND status = 'awaiting_client'"
        );
        $stmt->bindValue(':id', (int) $batchId, PDO::PARAM_INT);
        $stmt->bindValue(':client_id', (int) $clientId, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }
}
