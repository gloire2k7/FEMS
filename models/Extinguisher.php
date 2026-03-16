<?php

class Extinguisher extends Model
{
    protected $table = 'fire_extinguishers';

    public function create($data)
    {
        $query = "INSERT INTO " . $this->table . " (serial_number, qr_code_path, label_pdf_path, type, capacity, price, status, manufacturing_date, filling_date, expiry_date, client_id, location_id) VALUES (:serial_number, :qr_code_path, :label_pdf_path, :type, :capacity, :price, :status, :manufacturing_date, :filling_date, :expiry_date, :client_id, :location_id)";
        $stmt = $this->db->prepare($query);

        $status = isset($data['status']) ? $data['status'] : 'filled';
        $price = isset($data['price']) ? $data['price'] : 0;

        $stmt->bindParam(':serial_number', $data['serial_number']);
        $stmt->bindParam(':qr_code_path', $data['qr_code_path']);
        $stmt->bindParam(':label_pdf_path', $data['label_pdf_path']);
        $stmt->bindParam(':type', $data['type']);
        $stmt->bindParam(':capacity', $data['capacity']);
        $stmt->bindParam(':price', $price);
        $stmt->bindParam(':status', $status);
        $stmt->bindParam(':manufacturing_date', $data['manufacturing_date']);
        $stmt->bindParam(':filling_date', $data['filling_date']);
        $stmt->bindParam(':expiry_date', $data['expiry_date']);
        $stmt->bindParam(':client_id', $data['client_id']);
        $stmt->bindParam(':location_id', $data['location_id']);

        if ($stmt->execute()) {
            return $this->db->lastInsertId();
        }
        return false;
    }

    public function updateStatus($id, $status)
    {
        $query = "UPDATE " . $this->table . " SET status = :status WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':status', $status);
        $stmt->bindParam(':id', $id);
        return $stmt->execute();
    }

    public function update($id, $data)
    {
        $query = "UPDATE " . $this->table . " SET 
            serial_number = :serial_number, 
            type = :type, 
            capacity = :capacity, 
            price = :price,
            status = :status, 
            manufacturing_date = :manufacturing_date, 
            filling_date = :filling_date, 
            expiry_date = :expiry_date, 
            client_id = :client_id, 
            location_id = :location_id,
            qr_code_path = :qr_code_path,
            label_pdf_path = :label_pdf_path
            WHERE id = :id";
        $stmt = $this->db->prepare($query);

        $price = isset($data['price']) ? $data['price'] : 0;

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
        $query = "SELECT fe.*, c.company_name as client_name 
                  FROM " . $this->table . " fe
                  LEFT JOIN clients c ON fe.client_id = c.id
                  WHERE fe.id = :id LIMIT 1";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function findAvailableInStock($type, $capacity, $limit)
    {
        $query = "SELECT * FROM " . $this->table . " WHERE client_id IS NULL AND type = :type AND capacity = :capacity LIMIT :limit";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':type', $type);
        $stmt->bindParam(':capacity', $capacity);
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function allocateToOrder($id, $clientId, $orderId)
    {
        $query = "UPDATE " . $this->table . " SET client_id = :client_id, order_id = :order_id WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':client_id', $clientId);
        $stmt->bindParam(':order_id', $orderId);
        $stmt->bindParam(':id', $id);
        return $stmt->execute();
    }

    public function findBySerialNumber($serial)
    {
        $query = "SELECT fe.*, c.company_name as client_name 
                  FROM " . $this->table . " fe
                  LEFT JOIN clients c ON fe.client_id = c.id
                  WHERE fe.serial_number = :serial LIMIT 1";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':serial', $serial);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
