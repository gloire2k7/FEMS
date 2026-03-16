<?php

class Order extends Model
{
    protected $table = 'orders';

    public function create($data)
    {
        $query = "INSERT INTO orders (client_id, type, capacity, quantity, unit_price, total_price, status)
                  VALUES (:client_id, :type, :capacity, :quantity, :unit_price, :total_price, 'pending')";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':client_id', $data['client_id']);
        $stmt->bindParam(':type', $data['type']);
        $stmt->bindParam(':capacity', $data['capacity']);
        $stmt->bindParam(':quantity', $data['quantity']);
        $stmt->bindParam(':unit_price', $data['unit_price']);
        $stmt->bindParam(':total_price', $data['total_price']);
        if ($stmt->execute()) {
            return $this->db->lastInsertId();
        }
        return false;
    }

    public function findAll()
    {
        $query = "SELECT o.*, c.company_name as client_name, c.email as client_email
                  FROM orders o
                  LEFT JOIN clients c ON o.client_id = c.id
                  ORDER BY o.created_at DESC";
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findByClient($clientId)
    {
        $query = "SELECT * FROM orders WHERE client_id = :client_id ORDER BY created_at DESC";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':client_id', $clientId);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findById($id)
    {
        $query = "SELECT o.*, c.company_name as client_name, c.email as client_email
                  FROM orders o
                  LEFT JOIN clients c ON o.client_id = c.id
                  WHERE o.id = :id LIMIT 1";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function updateStatus($id, $status)
    {
        $query = "UPDATE orders SET status = :status WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':status', $status);
        $stmt->bindParam(':id', $id);
        return $stmt->execute();
    }
}
