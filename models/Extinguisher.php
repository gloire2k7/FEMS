<?php

class Extinguisher extends Model
{
    protected $table = 'fire_extinguishers';

    public function create($data)
    {
        $query = "INSERT INTO {$this->table}
            (serial_number, qr_code_path, label_pdf_path, type, capacity, price, status,
             manufacturing_date, filling_date, expiry_date, client_id, location_id)
            VALUES (:serial_number, :qr_code_path, :label_pdf_path, :type, :capacity, :price, :status,
             :manufacturing_date, :filling_date, :expiry_date, :client_id, :location_id)";
        $stmt = $this->db->prepare($query);

        $status = $data['status'] ?? 'filled';
        $price = $data['price'] ?? 0;
        $label = $data['label_pdf_path'] ?? null;
        $loc = $data['location_id'] ?? null;

        $stmt->bindParam(':serial_number', $data['serial_number']);
        $stmt->bindParam(':qr_code_path', $data['qr_code_path']);
        $stmt->bindParam(':label_pdf_path', $label);
        $stmt->bindParam(':type', $data['type']);
        $stmt->bindParam(':capacity', $data['capacity']);
        $stmt->bindParam(':price', $price);
        $stmt->bindParam(':status', $status);
        $stmt->bindParam(':manufacturing_date', $data['manufacturing_date']);
        $stmt->bindParam(':filling_date', $data['filling_date']);
        $stmt->bindParam(':expiry_date', $data['expiry_date']);
        $stmt->bindParam(':client_id', $data['client_id']);
        $stmt->bindParam(':location_id', $loc);

        return $stmt->execute() ? $this->db->lastInsertId() : false;
    }

    public function findPaginated($page = 1, $limit = 5, $status = 'in_stock', $sort = 'newest', $type = null)
    {
        $offset = ($page - 1) * $limit;

        if ($status === 'in_stock') {
            $where = 'fe.client_id IS NULL';
        } elseif ($status === 'allocated') {
            $where = 'fe.client_id IS NOT NULL';
        } else {
            $where = '1=1';
        }

        $params = [];
        if ($type) {
            $where .= ' AND fe.type = :type';
            $params[':type'] = $type;
        }

        $order = $sort === 'oldest' ? 'ASC' : 'DESC';

        $countSql = "SELECT COUNT(*) FROM {$this->table} fe WHERE $where";
        $countStmt = $this->db->prepare($countSql);
        foreach ($params as $k => $v) {
            $countStmt->bindValue($k, $v);
        }
        $countStmt->execute();
        $total = (int) $countStmt->fetchColumn();

        $query = "SELECT fe.*, c.company_name as client_name FROM {$this->table} fe
                  LEFT JOIN clients c ON fe.client_id = c.id
                  WHERE $where ORDER BY fe.created_at $order LIMIT :limit OFFSET :offset";
        $stmt = $this->db->prepare($query);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue(':limit', (int) $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int) $offset, PDO::PARAM_INT);
        $stmt->execute();

        return [
            'data' => $stmt->fetchAll(PDO::FETCH_ASSOC),
            'total' => $total,
            'page' => (int) $page,
            'last_page' => max(1, (int) ceil($total / $limit)),
        ];
    }

    public function getRecentMovementsPaginated($page = 1, $limit = 3)
    {
        $offset = ($page - 1) * $limit;
        $total = (int) $this->db->query("SELECT COUNT(*) FROM stock_movements")->fetchColumn();

        $stmt = $this->db->prepare(
            "SELECT sm.*, u.name as performer_name, fe.serial_number
             FROM stock_movements sm
             LEFT JOIN users u ON u.id = sm.performed_by
             LEFT JOIN fire_extinguishers fe ON fe.id = sm.extinguisher_id
             ORDER BY sm.created_at DESC LIMIT ? OFFSET ?"
        );
        $stmt->bindValue(1, (int) $limit, PDO::PARAM_INT);
        $stmt->bindValue(2, (int) $offset, PDO::PARAM_INT);
        $stmt->execute();

        return [
            'data'      => $stmt->fetchAll(PDO::FETCH_ASSOC),
            'total'     => $total,
            'page'      => (int) $page,
            'last_page' => max(1, (int) ceil($total / $limit)),
        ];
    }

    public function getStockSummary()
    {
        $byType = $this->db->query(
            "SELECT type, capacity, COUNT(*) as count, SUM(price) as total_value
             FROM {$this->table} WHERE client_id IS NULL AND status = 'filled'
             GROUP BY type, capacity ORDER BY type, capacity"
        )->fetchAll(PDO::FETCH_ASSOC);

        $totals = $this->db->query(
            "SELECT
                COUNT(*) as total_units,
                SUM(CASE WHEN client_id IS NULL AND status = 'filled' THEN 1 ELSE 0 END) as in_stock,
                SUM(CASE WHEN client_id IS NOT NULL THEN 1 ELSE 0 END) as allocated
             FROM {$this->table}"
        )->fetch(PDO::FETCH_ASSOC);

        return ['by_type' => $byType, 'totals' => $totals];
    }

    public function logMovement($extId, $action, $userId, $details = null)
    {
        $stmt = $this->db->prepare(
            "INSERT INTO stock_movements (extinguisher_id, action, performed_by, details) VALUES (?, ?, ?, ?)"
        );
        return $stmt->execute([$extId, $action, $userId, $details]);
    }

    public function getRecentMovements($limit = 10)
    {
        $stmt = $this->db->prepare(
            "SELECT sm.*, u.name as performer_name, fe.serial_number
             FROM stock_movements sm
             LEFT JOIN users u ON u.id = sm.performed_by
             LEFT JOIN fire_extinguishers fe ON fe.id = sm.extinguisher_id
             ORDER BY sm.created_at DESC LIMIT ?"
        );
        $stmt->bindValue(1, (int) $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function updateStatus($id, $status)
    {
        $stmt = $this->db->prepare("UPDATE {$this->table} SET status = :status WHERE id = :id");
        $stmt->bindParam(':status', $status);
        $stmt->bindParam(':id', $id);
        return $stmt->execute();
    }

    public function update($id, $data)
    {
        $query = "UPDATE {$this->table} SET
            serial_number = :serial_number, type = :type, capacity = :capacity, price = :price,
            status = :status, manufacturing_date = :manufacturing_date, filling_date = :filling_date,
            expiry_date = :expiry_date, client_id = :client_id, location_id = :location_id,
            qr_code_path = :qr_code_path, label_pdf_path = :label_pdf_path WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $price = $data['price'] ?? 0;
        $stmt->bindParam(':serial_number', $data['serial_number']);
        $stmt->bindParam(':type', $data['type']);
        $stmt->bindParam(':capacity', $data['capacity']);
        $stmt->bindParam(':price', $price);
        $stmt->bindParam(':status', $data['status']);
        $stmt->bindParam(':manufacturing_date', $data['manufacturing_date']);
        $stmt->bindParam(':filling_date', $data['filling_date']);
        $stmt->bindParam(':expiry_date', $data['expiry_date']);
        $stmt->bindParam(':client_id', $data['client_id']);
        $stmt->bindParam(':location_id', $data['location_id']);
        $stmt->bindParam(':qr_code_path', $data['qr_code_path']);
        $stmt->bindParam(':label_pdf_path', $data['label_pdf_path']);
        $stmt->bindParam(':id', $id);
        return $stmt->execute();
    }

    public function findById($id)
    {
        $query = "SELECT fe.*, c.company_name as client_name FROM {$this->table} fe
                  LEFT JOIN clients c ON fe.client_id = c.id WHERE fe.id = :id LIMIT 1";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function findAvailableInStock($type, $capacity, $limit)
    {
        $cap = preg_replace('/[^0-9]/', '', (string) $capacity);
        $query = "SELECT * FROM {$this->table}
                  WHERE client_id IS NULL AND status = 'filled' AND type = :type
                  AND REPLACE(REPLACE(LOWER(capacity), ' kg', ''), 'kg', '') = :capacity
                  LIMIT :limit";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':type', $type);
        $stmt->bindParam(':capacity', $cap);
        $stmt->bindValue(':limit', (int) $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function allocateToOrder($id, $clientId, $orderId)
    {
        $query = "UPDATE {$this->table} SET client_id = :client_id, order_id = :order_id WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':client_id', $clientId);
        $stmt->bindParam(':order_id', $orderId);
        $stmt->bindParam(':id', $id);
        return $stmt->execute();
    }

    public function findBySerialNumber($serial)
    {
        $query = "SELECT fe.*, c.company_name as client_name FROM {$this->table} fe
                  LEFT JOIN clients c ON fe.client_id = c.id WHERE fe.serial_number = :serial LIMIT 1";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':serial', $serial);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
