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
            (batch_id, client_id, extinguisher_id, service_type, preferred_date, client_notes, status, mandatory_instance_id)
            VALUES (:batch_id, :client_id, :extinguisher_id, :service_type, :preferred_date, :client_notes, 'pending', :mandatory_instance_id)";
        $stmt = $this->db->prepare($query);
        $batchId = $data['batch_id'] ?? null;
        $mandatoryId = $data['mandatory_instance_id'] ?? null;
        $stmt->bindValue(':batch_id', $batchId, $batchId ? PDO::PARAM_INT : PDO::PARAM_NULL);
        $stmt->bindValue(':client_id', (int) $data['client_id'], PDO::PARAM_INT);
        $stmt->bindValue(':extinguisher_id', (int) $data['extinguisher_id'], PDO::PARAM_INT);
        $stmt->bindValue(':service_type', $data['service_type']);
        $stmt->bindValue(':preferred_date', $data['preferred_date'] ?? null);
        $stmt->bindValue(':client_notes', $data['client_notes'] ?? null);
        $stmt->bindValue(':mandatory_instance_id', $mandatoryId, $mandatoryId ? PDO::PARAM_INT : PDO::PARAM_NULL);
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

    public function inspectorHasConflict($inspectorId, $date, $excludeBatchId = null)
    {
        $sql = "SELECT COUNT(*) FROM service_request_batches
                WHERE inspector_id = ? AND confirmed_date = ?
                AND status IN ('scheduled', 'awaiting_client') AND service_type = 'inspection'";
        $params = [(int) $inspectorId, $date];
        if ($excludeBatchId) {
            $sql .= ' AND id != ?';
            $params[] = (int) $excludeBatchId;
        }
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        if ((int) $stmt->fetchColumn() > 0) {
            return true;
        }
        $sql2 = "SELECT COUNT(*) FROM {$this->table}
                WHERE inspector_id = ? AND confirmed_date = ?
                AND status IN ('scheduled', 'awaiting_client') AND service_type = 'inspection' AND batch_id IS NULL";
        $stmt2 = $this->db->prepare($sql2);
        $stmt2->execute([(int) $inspectorId, $date]);
        return (int) $stmt2->fetchColumn() > 0;
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

    public function createMandatoryPlaceholder($clientId, $instanceId, $dueDate, $notes = null)
    {
        $extStmt = $this->db->prepare(
            "SELECT id FROM fire_extinguishers WHERE client_id = ? ORDER BY id ASC LIMIT 1"
        );
        $extStmt->execute([(int) $clientId]);
        $extId = (int) $extStmt->fetchColumn();
        if (!$extId) {
            return false;
        }
        return $this->create([
            'client_id'             => (int) $clientId,
            'extinguisher_id'       => $extId,
            'service_type'          => 'mandatory',
            'preferred_date'        => $dueDate,
            'client_notes'          => $notes,
            'mandatory_instance_id' => (int) $instanceId,
        ]);
    }

    public function findMandatoryPaginatedByClient($clientId, $page, $limit)
    {
        $offset = ($page - 1) * $limit;
        $where = "sr.client_id = :client_id AND sr.service_type = 'mandatory'";
        $params = [':client_id' => (int) $clientId];

        $countStmt = $this->db->prepare("SELECT COUNT(*) FROM {$this->table} sr WHERE $where");
        foreach ($params as $k => $v) {
            $countStmt->bindValue($k, $v);
        }
        $countStmt->execute();
        $total = (int) $countStmt->fetchColumn();

        $query = "SELECT sr.*, mit.name AS mandatory_name, mi.due_date, mi.deadline_date,
                         ui.name AS inspector_name, mca.inspector_id
                  FROM {$this->table} sr
                  JOIN mandatory_inspection_instances mi ON mi.id = sr.mandatory_instance_id
                  JOIN mandatory_client_assignments mca ON mca.id = mi.assignment_id
                  JOIN mandatory_inspection_types mit ON mit.id = mca.mandatory_type_id
                  LEFT JOIN users ui ON ui.id = mca.inspector_id
                  WHERE $where
                  ORDER BY sr.created_at DESC
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
            'total'     => $total,
            'page'      => (int) $page,
            'last_page' => max(1, (int) ceil($total / $limit)),
        ];
    }

    public function findByMandatoryInstanceId($instanceId)
    {
        $stmt = $this->db->prepare("SELECT * FROM {$this->table} WHERE mandatory_instance_id = :id LIMIT 1");
        $stmt->bindValue(':id', (int) $instanceId, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function findByBatchId($batchId)
    {
        $stmt = $this->db->prepare($this->baseSelect() . " WHERE sr.batch_id = :batch_id ORDER BY fe.serial_number");
        $stmt->bindValue(':batch_id', (int) $batchId, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function scheduleBatchItems($batchId, $inspectorId, $assignedBy, $confirmedDate)
    {
        $stmt = $this->db->prepare(
            "UPDATE {$this->table} SET inspector_id = :inspector_id, assigned_by = :assigned_by,
             confirmed_date = :confirmed_date, status = 'scheduled'
             WHERE batch_id = :batch_id AND status = 'pending'"
        );
        $stmt->bindValue(':inspector_id', (int) $inspectorId, PDO::PARAM_INT);
        $stmt->bindValue(':assigned_by', (int) $assignedBy, PDO::PARAM_INT);
        $stmt->bindValue(':confirmed_date', $confirmedDate);
        $stmt->bindValue(':batch_id', (int) $batchId, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }

    public function clientConfirmBatchDone($batchId, $clientId)
    {
        $stmt = $this->db->prepare(
            "UPDATE {$this->table} SET status = 'completed', client_confirmed_at = NOW()
             WHERE batch_id = :batch_id AND client_id = :client_id AND status = 'awaiting_client'"
        );
        $stmt->bindValue(':batch_id', (int) $batchId, PDO::PARAM_INT);
        $stmt->bindValue(':client_id', (int) $clientId, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }

    public function markBatchAwaitingClient($batchId)
    {
        $stmt = $this->db->prepare(
            "UPDATE {$this->table} SET status = 'awaiting_client'
             WHERE batch_id = :batch_id AND status = 'scheduled'"
        );
        $stmt->bindValue(':batch_id', (int) $batchId, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }

    public function markMandatoryAwaitingClient($instanceId)
    {
        $stmt = $this->db->prepare(
            "UPDATE {$this->table} SET status = 'awaiting_client'
             WHERE mandatory_instance_id = :id AND status = 'scheduled'"
        );
        $stmt->bindValue(':id', (int) $instanceId, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }

    public function clientConfirmMandatory($instanceId, $clientId)
    {
        $stmt = $this->db->prepare(
            "UPDATE {$this->table} SET status = 'completed', client_confirmed_at = NOW()
             WHERE mandatory_instance_id = :id AND client_id = :client_id AND status = 'awaiting_client'"
        );
        $stmt->bindValue(':id', (int) $instanceId, PDO::PARAM_INT);
        $stmt->bindValue(':client_id', (int) $clientId, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }
}
