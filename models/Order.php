<?php

class Order extends Model
{
    protected $table = 'orders';

    public function create($data)
    {
        $query = "INSERT INTO orders (client_id, type, capacity, quantity, unit_price, total_price,
                  delivery_address, payment_method, notes, status)
                  VALUES (:client_id, :type, :capacity, :quantity, :unit_price, :total_price,
                  :delivery_address, :payment_method, :notes, 'pending')";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':client_id', $data['client_id']);
        $stmt->bindParam(':type', $data['type']);
        $stmt->bindParam(':capacity', $data['capacity']);
        $stmt->bindParam(':quantity', $data['quantity']);
        $stmt->bindParam(':unit_price', $data['unit_price']);
        $stmt->bindParam(':total_price', $data['total_price']);
        $stmt->bindParam(':delivery_address', $data['delivery_address']);
        $stmt->bindParam(':payment_method', $data['payment_method']);
        $notes = $data['notes'] ?? null;
        $stmt->bindParam(':notes', $notes);
        return $stmt->execute() ? $this->db->lastInsertId() : false;
    }

    public function findPaginated($page = 1, $limit = 10, $clientId = null)
    {
        $offset = ($page - 1) * $limit;
        $where = '1=1';
        $params = [];
        if ($clientId) {
            $where = 'o.client_id = :client_id';
            $params[':client_id'] = $clientId;
        }

        $countSql = "SELECT COUNT(*) FROM orders o WHERE $where";
        $countStmt = $this->db->prepare($countSql);
        $countStmt->execute($params);
        $total = (int) $countStmt->fetchColumn();

        $query = "SELECT o.*, c.company_name as client_name, c.email as client_email
                  FROM orders o LEFT JOIN clients c ON o.client_id = c.id
                  WHERE $where ORDER BY o.created_at DESC LIMIT :limit OFFSET :offset";
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

    public function findAll()
    {
        return $this->findPaginated(1, 1000)['data'];
    }

    public function findByClient($clientId)
    {
        return $this->findPaginated(1, 1000, $clientId)['data'];
    }

    public function findById($id)
    {
        $query = "SELECT o.*, c.company_name as client_name, c.email as client_email
                  FROM orders o LEFT JOIN clients c ON o.client_id = c.id
                  WHERE o.id = :id LIMIT 1";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function updateStatus($id, $status, $extra = [])
    {
        $fields = ['status = :status'];
        $params = [':status' => $status, ':id' => $id];
        if (isset($extra['denial_reason'])) {
            $fields[] = 'denial_reason = :denial_reason';
            $params[':denial_reason'] = $extra['denial_reason'];
        }
        if ($status === 'delivered') {
            $fields[] = 'delivered_at = NOW()';
        }
        $query = "UPDATE orders SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $this->db->prepare($query);
        return $stmt->execute($params);
    }

    public function countByStatus($status = null)
    {
        if ($status) {
            $stmt = $this->db->prepare("SELECT COUNT(*) FROM orders WHERE status = ?");
            $stmt->execute([$status]);
        } else {
            $stmt = $this->db->query("SELECT COUNT(*) FROM orders");
        }
        return (int) $stmt->fetchColumn();
    }
}
