<?php

class ServiceRequest extends Model
{
    protected $table = 'service_requests';

    private function baseSelect()
    {
        return "SELECT sr.*,
                fe.serial_number, fe.type, fe.capacity,
                l.location_name, c.company_name,
                ui.name AS inspector_name, ua.name AS assigned_by_name,
                ia.id AS assignment_id
                FROM {$this->table} sr
                JOIN fire_extinguishers fe ON fe.id = sr.extinguisher_id
                LEFT JOIN locations l ON l.id = fe.location_id
                LEFT JOIN clients c ON c.id = sr.client_id
                LEFT JOIN users ui ON ui.id = sr.inspector_id
                LEFT JOIN users ua ON ua.id = sr.assigned_by
                LEFT JOIN inspection_assignments ia ON ia.service_request_id = sr.id";
    }

    public function create($data)
    {
        $query = "INSERT INTO {$this->table}
            (client_id, extinguisher_id, service_type, preferred_date, client_notes, status)
            VALUES (:client_id, :extinguisher_id, :service_type, :preferred_date, :client_notes, 'pending')";
        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':client_id', (int) $data['client_id'], PDO::PARAM_INT);
        $stmt->bindValue(':extinguisher_id', (int) $data['extinguisher_id'], PDO::PARAM_INT);
        $stmt->bindValue(':service_type', $data['service_type']);
        $stmt->bindValue(':preferred_date', $data['preferred_date'] ?? null);
        $stmt->bindValue(':client_notes', $data['client_notes'] ?? null);
        return $stmt->execute() ? (int) $this->db->lastInsertId() : false;
    }

    public function findById($id)
    {
        $stmt = $this->db->prepare($this->baseSelect() . " WHERE sr.id = :id LIMIT 1");
        $stmt->bindValue(':id', (int) $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function findPaginatedByClient($clientId, $page, $limit, $type = null)
    {
        $offset = ($page - 1) * $limit;
        $where = 'sr.client_id = :client_id';
        $params = [':client_id' => (int) $clientId];
        if ($type && in_array($type, ['inspection', 'refill', 'maintenance'], true)) {
            $where .= ' AND sr.service_type = :type';
            $params[':type'] = $type;
        }

        $countStmt = $this->db->prepare("SELECT COUNT(*) FROM {$this->table} sr WHERE $where");
        foreach ($params as $k => $v) {
            $countStmt->bindValue($k, $v);
        }
        $countStmt->execute();
        $total = (int) $countStmt->fetchColumn();

        $query = $this->baseSelect() . " WHERE $where ORDER BY sr.created_at DESC LIMIT :limit OFFSET :offset";
        $stmt = $this->db->prepare($query);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue(':limit', (int) $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int) $offset, PDO::PARAM_INT);
        $stmt->execute();

        return [
            'data'      => $stmt->fetchAll(PDO::FETCH_ASSOC),
            'total'     => $total,
            'page'      => (int) $page,
            'last_page' => max(1, (int) ceil($total / $limit)),
        ];
    }

    public function findPaginatedForAdmin($types, $page, $limit, $status = null)
    {
        $offset = ($page - 1) * $limit;
        $placeholders = implode(',', array_fill(0, count($types), '?'));
        $where = "sr.service_type IN ($placeholders)";
        $params = $types;

        if ($status && in_array($status, ['pending', 'scheduled', 'awaiting_client', 'completed'], true)) {
            $where .= ' AND sr.status = ?';
            $params[] = $status;
        } else {
            $where .= " AND sr.status != 'cancelled'";
        }

        $countSql = "SELECT COUNT(*) FROM {$this->table} sr WHERE $where";
        $countStmt = $this->db->prepare($countSql);
        $countStmt->execute($params);
        $total = (int) $countStmt->fetchColumn();

        $query = $this->baseSelect() . " WHERE $where ORDER BY FIELD(sr.status,'pending','scheduled','awaiting_client','completed'), sr.created_at DESC LIMIT ? OFFSET ?";
        $stmt = $this->db->prepare($query);
        $i = 1;
        foreach ($params as $p) {
            $stmt->bindValue($i++, $p);
        }
        $stmt->bindValue($i++, (int) $limit, PDO::PARAM_INT);
        $stmt->bindValue($i, (int) $offset, PDO::PARAM_INT);
        $stmt->execute();

        return [
            'data'      => $stmt->fetchAll(PDO::FETCH_ASSOC),
            'total'     => $total,
            'page'      => (int) $page,
            'last_page' => max(1, (int) ceil($total / $limit)),
        ];
    }

    public function findPendingInspectionsPaginated($page, $limit)
    {
        return $this->findPaginatedForAdmin(['inspection'], $page, $limit, 'pending');
    }

    public function hasActiveDuplicate($extinguisherId, $serviceType, $excludeId = null)
    {
        $sql = "SELECT COUNT(*) FROM {$this->table}
                WHERE extinguisher_id = ? AND service_type = ?
                AND status IN ('pending', 'scheduled', 'awaiting_client')";
        $params = [(int) $extinguisherId, $serviceType];
        if ($excludeId) {
            $sql .= ' AND id != ?';
            $params[] = (int) $excludeId;
        }
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return (int) $stmt->fetchColumn() > 0;
    }

    public function inspectorHasConflict($inspectorId, $date, $excludeRequestId = null)
    {
        $sql = "SELECT COUNT(*) FROM {$this->table}
                WHERE inspector_id = ? AND confirmed_date = ?
                AND status IN ('scheduled', 'awaiting_client') AND service_type = 'inspection'";
        $params = [(int) $inspectorId, $date];
        if ($excludeRequestId) {
            $sql .= ' AND id != ?';
            $params[] = (int) $excludeRequestId;
        }
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return (int) $stmt->fetchColumn() > 0;
    }

    public function scheduleInspection($id, $inspectorId, $assignedBy, $confirmedDate)
    {
        $stmt = $this->db->prepare(
            "UPDATE {$this->table} SET inspector_id = :inspector_id, assigned_by = :assigned_by,
             confirmed_date = :confirmed_date, status = 'scheduled'
             WHERE id = :id AND service_type = 'inspection' AND status = 'pending'"
        );
        $stmt->bindValue(':inspector_id', (int) $inspectorId, PDO::PARAM_INT);
        $stmt->bindValue(':assigned_by', (int) $assignedBy, PDO::PARAM_INT);
        $stmt->bindValue(':confirmed_date', $confirmedDate);
        $stmt->bindValue(':id', (int) $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }

    public function scheduleRefillMaintenance($id, $confirmedDate, $fee = null)
    {
        $stmt = $this->db->prepare(
            "UPDATE {$this->table} SET confirmed_date = :confirmed_date, fee = :fee, status = 'scheduled'
             WHERE id = :id AND service_type IN ('refill','maintenance') AND status = 'pending'"
        );
        $stmt->bindValue(':confirmed_date', $confirmedDate);
        $stmt->bindValue(':fee', $fee);
        $stmt->bindValue(':id', (int) $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }

    public function markAwaitingClient($id, $data = [])
    {
        $fields = ["status = 'awaiting_client'"];
        $params = [':id' => (int) $id];
        if (isset($data['inspector_notes'])) {
            $fields[] = 'inspector_notes = :inspector_notes';
            $params[':inspector_notes'] = $data['inspector_notes'];
        }
        if (isset($data['result_status'])) {
            $fields[] = 'result_status = :result_status';
            $params[':result_status'] = $data['result_status'];
        }
        $sql = 'UPDATE ' . $this->table . ' SET ' . implode(', ', $fields) . ' WHERE id = :id AND status = \'scheduled\'';
        $stmt = $this->db->prepare($sql);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }

    public function clientConfirmDone($id, $clientId)
    {
        $stmt = $this->db->prepare(
            "UPDATE {$this->table} SET status = 'completed', client_confirmed_at = NOW()
             WHERE id = :id AND client_id = :client_id AND status = 'awaiting_client'"
        );
        $stmt->bindValue(':id', (int) $id, PDO::PARAM_INT);
        $stmt->bindValue(':client_id', (int) $clientId, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }
}
