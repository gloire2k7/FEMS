<?php

class Location extends Model
{
    protected $table = 'locations';

    public function create($data)
    {
        $query = "INSERT INTO {$this->table} (client_id, location_name, address, gps_lat, gps_lng)
                  VALUES (:client_id, :location_name, :address, :gps_lat, :gps_lng)";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':client_id', $data['client_id'], PDO::PARAM_INT);
        $stmt->bindParam(':location_name', $data['location_name']);
        $stmt->bindParam(':address', $data['address']);
        $stmt->bindParam(':gps_lat', $data['gps_lat']);
        $stmt->bindParam(':gps_lng', $data['gps_lng']);
        return $stmt->execute() ? (int) $this->db->lastInsertId() : false;
    }

    public function findPaginatedByClient($clientId, $page = 1, $limit = 5)
    {
        $offset = ($page - 1) * $limit;
        $clientId = (int) $clientId;

        $countStmt = $this->db->prepare("SELECT COUNT(*) FROM {$this->table} WHERE client_id = ?");
        $countStmt->execute([$clientId]);
        $total = (int) $countStmt->fetchColumn();

        $unitsStmt = $this->db->prepare(
            "SELECT COUNT(*) FROM fire_extinguishers WHERE client_id = ? AND location_id IS NOT NULL"
        );
        $unitsStmt->execute([$clientId]);
        $assignedUnits = (int) $unitsStmt->fetchColumn();

        $query = "SELECT l.*,
                    (SELECT COUNT(*) FROM fire_extinguishers fe WHERE fe.location_id = l.id) AS unit_count
                  FROM {$this->table} l
                  WHERE l.client_id = :client_id
                  ORDER BY l.location_name ASC
                  LIMIT :limit OFFSET :offset";
        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':client_id', $clientId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', (int) $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int) $offset, PDO::PARAM_INT);
        $stmt->execute();

        return [
            'data'          => $stmt->fetchAll(PDO::FETCH_ASSOC),
            'total'         => $total,
            'page'          => (int) $page,
            'last_page'     => max(1, (int) ceil($total / $limit)),
            'assigned_units' => $assignedUnits,
        ];
    }

    public function findByIdForClient($id, $clientId)
    {
        $query = "SELECT l.*,
                    (SELECT COUNT(*) FROM fire_extinguishers fe WHERE fe.location_id = l.id) AS unit_count
                  FROM {$this->table} l
                  WHERE l.id = :id AND l.client_id = :client_id LIMIT 1";
        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':id', (int) $id, PDO::PARAM_INT);
        $stmt->bindValue(':client_id', (int) $clientId, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function getExtinguishers($locationId)
    {
        $query = "SELECT fe.id, fe.serial_number, fe.type, fe.capacity, fe.status, fe.expiry_date
                  FROM fire_extinguishers fe
                  WHERE fe.location_id = :location_id
                  ORDER BY fe.serial_number ASC";
        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':location_id', (int) $locationId, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getUnassignedExtinguishersPaginated($clientId, $page = 1, $limit = 5, $search = null)
    {
        $offset = ($page - 1) * $limit;
        $clientId = (int) $clientId;
        $where = 'fe.client_id = :client_id AND fe.location_id IS NULL';
        $params = [':client_id' => $clientId];

        if ($search !== null && trim($search) !== '') {
            $where .= ' AND fe.serial_number LIKE :search';
            $params[':search'] = '%' . trim($search) . '%';
        }

        $countSql = "SELECT COUNT(*) FROM fire_extinguishers fe WHERE $where";
        $countStmt = $this->db->prepare($countSql);
        foreach ($params as $k => $v) {
            $countStmt->bindValue($k, $v);
        }
        $countStmt->execute();
        $total = (int) $countStmt->fetchColumn();

        $query = "SELECT fe.id, fe.serial_number, fe.type, fe.capacity, fe.status, fe.expiry_date
                  FROM fire_extinguishers fe
                  WHERE $where
                  ORDER BY fe.serial_number ASC
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

    public function getUnassignedExtinguishers($clientId)
    {
        $query = "SELECT fe.id, fe.serial_number, fe.type, fe.capacity, fe.status, fe.expiry_date
                  FROM fire_extinguishers fe
                  WHERE fe.client_id = :client_id AND fe.location_id IS NULL
                  ORDER BY fe.serial_number ASC";
        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':client_id', (int) $clientId, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function addExtinguishers($locationId, array $extinguisherIds, $clientId)
    {
        $locationId = (int) $locationId;
        $clientId = (int) $clientId;
        $extinguisherIds = array_values(array_unique(array_map('intval', $extinguisherIds)));

        if (empty($extinguisherIds)) {
            return ['ok' => false, 'message' => 'No units selected.'];
        }

        $placeholders = implode(',', array_fill(0, count($extinguisherIds), '?'));
        $stmt = $this->db->prepare(
            "SELECT id, location_id FROM fire_extinguishers
             WHERE id IN ($placeholders) AND client_id = ?"
        );
        $stmt->execute(array_merge($extinguisherIds, [$clientId]));
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (count($rows) !== count($extinguisherIds)) {
            return ['ok' => false, 'message' => 'One or more units do not belong to your account.'];
        }

        foreach ($rows as $row) {
            if ($row['location_id'] !== null && (int) $row['location_id'] !== $locationId) {
                return [
                    'ok'      => false,
                    'message' => 'A unit is already assigned to another location. Remove it there first.',
                ];
            }
        }

        $update = $this->db->prepare(
            "UPDATE fire_extinguishers SET location_id = :location_id WHERE id = :id AND client_id = :client_id"
        );
        foreach ($extinguisherIds as $extId) {
            $update->bindValue(':location_id', $locationId, PDO::PARAM_INT);
            $update->bindValue(':id', $extId, PDO::PARAM_INT);
            $update->bindValue(':client_id', $clientId, PDO::PARAM_INT);
            $update->execute();
        }

        return ['ok' => true, 'added' => count($extinguisherIds)];
    }

    public function removeExtinguishers($locationId, array $extinguisherIds, $clientId)
    {
        $locationId = (int) $locationId;
        $clientId = (int) $clientId;
        $extinguisherIds = array_values(array_unique(array_map('intval', $extinguisherIds)));

        if (empty($extinguisherIds)) {
            return ['ok' => false, 'message' => 'No units selected.'];
        }

        $placeholders = implode(',', array_fill(0, count($extinguisherIds), '?'));
        $stmt = $this->db->prepare(
            "UPDATE fire_extinguishers SET location_id = NULL
             WHERE location_id = ? AND client_id = ? AND id IN ($placeholders)"
        );
        $stmt->execute(array_merge([$locationId, $clientId], $extinguisherIds));

        return ['ok' => true, 'removed' => $stmt->rowCount()];
    }
}
