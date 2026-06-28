<?php

class InspectionAssignment extends Model
{
    protected $table = 'inspection_assignments';

    private function baseSelect()
    {
        return "SELECT ia.*,
                fe.serial_number, fe.type, fe.capacity, fe.status AS unit_status,
                l.location_name, l.address AS location_address,
                c.company_name,
                u.name AS inspector_name,
                sr.preferred_date, sr.client_notes
                FROM {$this->table} ia
                JOIN fire_extinguishers fe ON fe.id = ia.extinguisher_id
                LEFT JOIN locations l ON l.id = fe.location_id
                LEFT JOIN clients c ON c.id = fe.client_id
                LEFT JOIN users u ON u.id = ia.inspector_id
                LEFT JOIN service_requests sr ON sr.id = ia.service_request_id";
    }

    public function create($data)
    {
        $query = "INSERT INTO {$this->table}
            (extinguisher_id, inspector_id, assigned_by, status, due_date, service_request_id)
            VALUES (:extinguisher_id, :inspector_id, :assigned_by, :status, :due_date, :service_request_id)";
        $stmt = $this->db->prepare($query);
        $inspectorId = $data['inspector_id'] ?? null;
        $status = $inspectorId ? 'assigned' : 'pending';
        $assignedBy = $data['assigned_by'] ?? null;
        $serviceRequestId = $data['service_request_id'] ?? null;
        $stmt->bindValue(':extinguisher_id', (int) $data['extinguisher_id'], PDO::PARAM_INT);
        $stmt->bindValue(':inspector_id', $inspectorId, $inspectorId ? PDO::PARAM_INT : PDO::PARAM_NULL);
        $stmt->bindValue(':assigned_by', $assignedBy, $assignedBy ? PDO::PARAM_INT : PDO::PARAM_NULL);
        $stmt->bindValue(':status', $status);
        $stmt->bindValue(':due_date', $data['due_date'] ?? null);
        $stmt->bindValue(':service_request_id', $serviceRequestId, $serviceRequestId ? PDO::PARAM_INT : PDO::PARAM_NULL);
        return $stmt->execute() ? (int) $this->db->lastInsertId() : false;
    }

    public function assignWithDate($id, $inspectorId, $assignedBy, $confirmedDate)
    {
        $stmt = $this->db->prepare(
            "UPDATE {$this->table} SET inspector_id = :inspector_id, assigned_by = :assigned_by,
             status = 'assigned', due_date = :due_date
             WHERE id = :id AND status = 'pending'"
        );
        $stmt->bindValue(':inspector_id', (int) $inspectorId, PDO::PARAM_INT);
        $stmt->bindValue(':assigned_by', (int) $assignedBy, PDO::PARAM_INT);
        $stmt->bindValue(':due_date', $confirmedDate);
        $stmt->bindValue(':id', (int) $id, PDO::PARAM_INT);
        return $stmt->execute() && $stmt->rowCount() > 0;
    }

    public function claimWithDate($id, $inspectorId, $confirmedDate)
    {
        $stmt = $this->db->prepare(
            "UPDATE {$this->table} SET inspector_id = :inspector_id, status = 'assigned', due_date = :due_date
             WHERE id = :id AND inspector_id IS NULL AND status = 'pending'"
        );
        $stmt->bindValue(':inspector_id', (int) $inspectorId, PDO::PARAM_INT);
        $stmt->bindValue(':due_date', $confirmedDate);
        $stmt->bindValue(':id', (int) $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }

    public function findByServiceRequestId($serviceRequestId)
    {
        $query = $this->baseSelect() . " WHERE ia.service_request_id = :sr_id LIMIT 1";
        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':sr_id', (int) $serviceRequestId, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function findById($id)
    {
        $query = $this->baseSelect() . " WHERE ia.id = :id LIMIT 1";
        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':id', (int) $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function findPoolPaginated($page = 1, $limit = 10)
    {
        return $this->findPoolBatchesPaginated($page, $limit);
    }

    public function findPoolBatchesPaginated($page = 1, $limit = 10)
    {
        $offset = ($page - 1) * $limit;
        $where = "ia.inspector_id IS NULL AND ia.status = 'pending'";

        $countSql = "SELECT COUNT(DISTINCT COALESCE(sr.batch_id, ia.id)) FROM {$this->table} ia
                     LEFT JOIN service_requests sr ON sr.id = ia.service_request_id
                     WHERE $where";
        $count = (int) $this->db->query($countSql)->fetchColumn();

        $query = "SELECT COALESCE(sr.batch_id, ia.id) AS pool_key,
                         sr.batch_id,
                         MIN(ia.id) AS first_assignment_id,
                         COUNT(ia.id) AS unit_count,
                         MIN(sr.preferred_date) AS preferred_date,
                         MIN(sr.client_notes) AS client_notes,
                         MIN(c.company_name) AS company_name,
                         MIN(fe.serial_number) AS sample_serial,
                         GROUP_CONCAT(DISTINCT fe.serial_number ORDER BY fe.serial_number SEPARATOR ', ') AS serial_numbers
                  FROM {$this->table} ia
                  JOIN fire_extinguishers fe ON fe.id = ia.extinguisher_id
                  LEFT JOIN clients c ON c.id = fe.client_id
                  LEFT JOIN service_requests sr ON sr.id = ia.service_request_id
                  WHERE $where
                  GROUP BY COALESCE(sr.batch_id, ia.id)
                  ORDER BY MIN(ia.created_at) ASC
                  LIMIT :limit OFFSET :offset";
        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':limit', (int) $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int) $offset, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as &$row) {
            $row['id'] = (int) $row['first_assignment_id'];
            $row['items'] = $this->findPendingByPoolKey($row['batch_id'] ?: null, (int) $row['first_assignment_id']);
        }

        return [
            'data'      => $rows,
            'total'     => $count,
            'page'      => (int) $page,
            'last_page' => max(1, (int) ceil($count / $limit)),
        ];
    }

    public function findPendingByPoolKey($batchId, $assignmentId)
    {
        if ($batchId) {
            $query = $this->baseSelect() . " WHERE ia.inspector_id IS NULL AND ia.status = 'pending'
                      AND sr.batch_id = :batch_id ORDER BY fe.serial_number";
            $stmt = $this->db->prepare($query);
            $stmt->bindValue(':batch_id', (int) $batchId, PDO::PARAM_INT);
        } else {
            $query = $this->baseSelect() . " WHERE ia.id = :id AND ia.status = 'pending'";
            $stmt = $this->db->prepare($query);
            $stmt->bindValue(':id', (int) $assignmentId, PDO::PARAM_INT);
        }
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function claimBatch($batchId, $assignmentId, $inspectorId, $confirmedDate)
    {
        if ($batchId) {
            $stmt = $this->db->prepare(
                "UPDATE {$this->table} ia
                 JOIN service_requests sr ON sr.id = ia.service_request_id
                 SET ia.inspector_id = :inspector_id, ia.status = 'assigned', ia.due_date = :due_date
                 WHERE sr.batch_id = :batch_id AND ia.inspector_id IS NULL AND ia.status = 'pending'"
            );
            $stmt->bindValue(':inspector_id', (int) $inspectorId, PDO::PARAM_INT);
            $stmt->bindValue(':due_date', $confirmedDate);
            $stmt->bindValue(':batch_id', (int) $batchId, PDO::PARAM_INT);
        } else {
            return $this->claimWithDate((int) $assignmentId, (int) $inspectorId, $confirmedDate);
        }
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }

    public function assignBatchWithDate($batchId, $inspectorId, $assignedBy, $confirmedDate)
    {
        $stmt = $this->db->prepare(
            "UPDATE {$this->table} ia
             JOIN service_requests sr ON sr.id = ia.service_request_id
             SET ia.inspector_id = :inspector_id, ia.assigned_by = :assigned_by,
                 ia.status = 'assigned', ia.due_date = :due_date
             WHERE sr.batch_id = :batch_id AND ia.status = 'pending'"
        );
        $stmt->bindValue(':inspector_id', (int) $inspectorId, PDO::PARAM_INT);
        $stmt->bindValue(':assigned_by', (int) $assignedBy, PDO::PARAM_INT);
        $stmt->bindValue(':due_date', $confirmedDate);
        $stmt->bindValue(':batch_id', (int) $batchId, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }

    public function findPoolPaginatedLegacy($page = 1, $limit = 10)
    {
        $offset = ($page - 1) * $limit;
        $where = "ia.inspector_id IS NULL AND ia.status = 'pending'";

        $count = (int) $this->db->query(
            "SELECT COUNT(*) FROM {$this->table} ia WHERE $where"
        )->fetchColumn();

        $query = $this->baseSelect() . " WHERE $where ORDER BY ia.created_at ASC
                  LIMIT :limit OFFSET :offset";
        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':limit', (int) $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int) $offset, PDO::PARAM_INT);
        $stmt->execute();

        return [
            'data'      => $stmt->fetchAll(PDO::FETCH_ASSOC),
            'total'     => $count,
            'page'      => (int) $page,
            'last_page' => max(1, (int) ceil($count / $limit)),
        ];
    }

    public function findByInspectorPaginated($inspectorId, $page = 1, $limit = 10, $status = null)
    {
        $offset = ($page - 1) * $limit;
        $inspectorId = (int) $inspectorId;
        $where = 'ia.inspector_id = :inspector_id';
        $params = [':inspector_id' => $inspectorId];

        if ($status && in_array($status, ['assigned', 'completed'], true)) {
            $where .= ' AND ia.status = :status';
            $params[':status'] = $status;
        } else {
            $where .= " AND ia.status IN ('assigned', 'completed')";
        }

        $countSql = "SELECT COUNT(*) FROM {$this->table} ia WHERE $where";
        $countStmt = $this->db->prepare($countSql);
        foreach ($params as $k => $v) {
            $countStmt->bindValue($k, $v);
        }
        $countStmt->execute();
        $count = (int) $countStmt->fetchColumn();

        $query = $this->baseSelect() . " WHERE $where ORDER BY
                  FIELD(ia.status, 'assigned', 'completed'), ia.created_at DESC
                  LIMIT :limit OFFSET :offset";
        $stmt = $this->db->prepare($query);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue(':limit', (int) $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int) $offset, PDO::PARAM_INT);
        $stmt->execute();

        return [
            'data'      => $stmt->fetchAll(PDO::FETCH_ASSOC),
            'total'     => $count,
            'page'      => (int) $page,
            'last_page' => max(1, (int) ceil($count / $limit)),
        ];
    }

    public function findAllPaginated($page = 1, $limit = 10)
    {
        $offset = ($page - 1) * $limit;
        $count = (int) $this->db->query("SELECT COUNT(*) FROM {$this->table}")->fetchColumn();

        $query = $this->baseSelect() . " ORDER BY ia.created_at DESC LIMIT :limit OFFSET :offset";
        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':limit', (int) $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int) $offset, PDO::PARAM_INT);
        $stmt->execute();

        return [
            'data'      => $stmt->fetchAll(PDO::FETCH_ASSOC),
            'total'     => $count,
            'page'      => (int) $page,
            'last_page' => max(1, (int) ceil($count / $limit)),
        ];
    }

    public function claim($id, $inspectorId)
    {
        $stmt = $this->db->prepare(
            "UPDATE {$this->table} SET inspector_id = :inspector_id, status = 'assigned'
             WHERE id = :id AND inspector_id IS NULL AND status = 'pending'"
        );
        $stmt->bindValue(':inspector_id', (int) $inspectorId, PDO::PARAM_INT);
        $stmt->bindValue(':id', (int) $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }

    public function complete($id, $inspectorId, $data)
    {
        $stmt = $this->db->prepare(
            "UPDATE {$this->table}
             SET status = 'completed', notes = :notes, result_status = :result_status,
                 inspection_date = :inspection_date, completed_at = NOW()
             WHERE id = :id AND inspector_id = :inspector_id AND status = 'assigned'"
        );
        $stmt->bindValue(':notes', $data['notes'] ?? null);
        $stmt->bindValue(':result_status', $data['result_status']);
        $stmt->bindValue(':inspection_date', $data['inspection_date'] ?? date('Y-m-d'));
        $stmt->bindValue(':id', (int) $id, PDO::PARAM_INT);
        $stmt->bindValue(':inspector_id', (int) $inspectorId, PDO::PARAM_INT);
        return $stmt->execute() && $stmt->rowCount() > 0;
    }

    public function getInspectorStats($inspectorId)
    {
        $inspectorId = (int) $inspectorId;

        $pool = (int) $this->db->query(
            "SELECT COUNT(*) FROM {$this->table} WHERE inspector_id IS NULL AND status = 'pending'"
        )->fetchColumn();

        $stmtA = $this->db->prepare(
            "SELECT COUNT(*) FROM {$this->table} WHERE inspector_id = ? AND status = 'assigned'"
        );
        $stmtA->execute([$inspectorId]);
        $assigned = (int) $stmtA->fetchColumn();

        $stmtC = $this->db->prepare(
            "SELECT COUNT(*) FROM {$this->table} WHERE inspector_id = ? AND status = 'completed'"
        );
        $stmtC->execute([$inspectorId]);
        $completed = (int) $stmtC->fetchColumn();

        return ['pool' => $pool, 'assigned' => $assigned, 'completed' => $completed];
    }

    public function getCompletedForInspector($inspectorId)
    {
        $query = $this->baseSelect() .
            " WHERE ia.inspector_id = :inspector_id AND ia.status = 'completed'
              ORDER BY ia.completed_at DESC";
        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':inspector_id', (int) $inspectorId, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
