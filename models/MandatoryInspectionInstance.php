<?php

class MandatoryInspectionInstance extends Model
{
    protected $table = 'mandatory_inspection_instances';

    private function baseSelect()
    {
        return "SELECT mi.*,
                mit.name AS mandatory_name, mit.interval_months, mit.deadline_days,
                mca.client_id, mca.inspector_id, mca.last_completed_at,
                c.company_name, sr.id AS service_request_id
                FROM {$this->table} mi
                JOIN mandatory_client_assignments mca ON mca.id = mi.assignment_id
                JOIN mandatory_inspection_types mit ON mit.id = mca.mandatory_type_id
                JOIN clients c ON c.id = mca.client_id
                LEFT JOIN service_requests sr ON sr.mandatory_instance_id = mi.id";
    }

    public function create($assignmentId, $dueDate, $deadlineDate)
    {
        $stmt = $this->db->prepare(
            "INSERT INTO {$this->table} (assignment_id, due_date, deadline_date, status)
             VALUES (:assignment_id, :due_date, :deadline_date, 'scheduled')"
        );
        $stmt->bindValue(':assignment_id', (int) $assignmentId, PDO::PARAM_INT);
        $stmt->bindValue(':due_date', $dueDate);
        $stmt->bindValue(':deadline_date', $deadlineDate);
        return $stmt->execute() ? (int) $this->db->lastInsertId() : false;
    }

    public function findById($id)
    {
        $stmt = $this->db->prepare($this->baseSelect() . " WHERE mi.id = :id LIMIT 1");
        $stmt->bindValue(':id', (int) $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function findByInspectorPaginated($inspectorId, $page, $limit, $status = null)
    {
        $offset = ($page - 1) * $limit;
        $where = 'mca.inspector_id = :inspector_id';
        $params = [':inspector_id' => (int) $inspectorId];
        if ($status && in_array($status, ['scheduled', 'awaiting_client', 'completed'], true)) {
            $where .= ' AND mi.status = :status';
            $params[':status'] = $status;
        } else {
            $where .= " AND mi.status IN ('scheduled', 'awaiting_client')";
        }

        $countStmt = $this->db->prepare(
            "SELECT COUNT(*) FROM {$this->table} mi
             JOIN mandatory_client_assignments mca ON mca.id = mi.assignment_id
             WHERE $where"
        );
        foreach ($params as $k => $v) {
            $countStmt->bindValue($k, $v);
        }
        $countStmt->execute();
        $total = (int) $countStmt->fetchColumn();

        $query = $this->baseSelect() . " WHERE $where ORDER BY mi.due_date ASC LIMIT :limit OFFSET :offset";
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

    public function complete($id, $inspectorId, $data)
    {
        $stmt = $this->db->prepare(
            "UPDATE {$this->table} mi
             JOIN mandatory_client_assignments mca ON mca.id = mi.assignment_id
             SET mi.status = 'awaiting_client', mi.inspector_notes = :notes,
                 mi.result_status = :result_status, mi.completed_at = NOW()
             WHERE mi.id = :id AND mca.inspector_id = :inspector_id AND mi.status = 'scheduled'"
        );
        $stmt->bindValue(':notes', $data['notes'] ?? null);
        $stmt->bindValue(':result_status', $data['result_status']);
        $stmt->bindValue(':id', (int) $id, PDO::PARAM_INT);
        $stmt->bindValue(':inspector_id', (int) $inspectorId, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }

    public function clientConfirm($id, $clientId)
    {
        $stmt = $this->db->prepare(
            "UPDATE {$this->table} mi
             JOIN mandatory_client_assignments mca ON mca.id = mi.assignment_id
             SET mi.status = 'completed', mi.client_confirmed_at = NOW()
             WHERE mi.id = :id AND mca.client_id = :client_id AND mi.status = 'awaiting_client'"
        );
        $stmt->bindValue(':id', (int) $id, PDO::PARAM_INT);
        $stmt->bindValue(':client_id', (int) $clientId, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }

    public function hasActiveForAssignment($assignmentId)
    {
        $stmt = $this->db->prepare(
            "SELECT COUNT(*) FROM {$this->table}
             WHERE assignment_id = ? AND status IN ('scheduled', 'awaiting_client')"
        );
        $stmt->execute([(int) $assignmentId]);
        return (int) $stmt->fetchColumn() > 0;
    }
}
