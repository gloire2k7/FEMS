<?php

class Maintenance extends Model
{
    protected $table = 'maintenance_records';

    public function create($data)
    {
        $query = "INSERT INTO " . $this->table . " (extinguisher_id, service_type, description, service_date, performed_by) VALUES (:extinguisher_id, :service_type, :description, :service_date, :performed_by)";
        $stmt = $this->db->prepare($query);

        $stmt->bindParam(':extinguisher_id', $data['extinguisher_id']);
        $stmt->bindParam(':service_type', $data['service_type']);
        $stmt->bindParam(':description', $data['description']);
        $stmt->bindParam(':service_date', $data['service_date']);
        $stmt->bindParam(':performed_by', $data['performed_by']);

        if ($stmt->execute()) {
            return $this->db->lastInsertId();
        }
        return false;
    }

    public function findByExtinguisherId($extinguisherId)
    {
        $query = "SELECT m.*, u.name as performed_by_name FROM " . $this->table . " m JOIN users u ON m.performed_by = u.id WHERE m.extinguisher_id = :extinguisher_id ORDER BY m.service_date DESC";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':extinguisher_id', $extinguisherId);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
