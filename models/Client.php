<?php

class Client extends Model
{
    protected $table = 'clients';

    public function create($data)
    {
        $query = "INSERT INTO " . $this->table . " (company_name, contact_person, phone, email, address, gps_lat, gps_lng, delivery_instructions) VALUES (:company_name, :contact_person, :phone, :email, :address, :gps_lat, :gps_lng, :delivery_instructions)";
        $stmt = $this->db->prepare($query);

        $stmt->bindParam(':company_name', $data['company_name']);
        $stmt->bindParam(':contact_person', $data['contact_person']);
        $stmt->bindParam(':phone', $data['phone']);
        $stmt->bindParam(':email', $data['email']);
        $stmt->bindParam(':address', $data['address']);
        $stmt->bindParam(':gps_lat', $data['gps_lat']);
        $stmt->bindParam(':gps_lng', $data['gps_lng']);
        $stmt->bindParam(':delivery_instructions', $data['delivery_instructions']);

        if ($stmt->execute()) {
            return $this->db->lastInsertId();
        }
        return false;
    }

    public function update($id, $data)
    {
        $query = "UPDATE " . $this->table . " SET company_name = :company_name, contact_person = :contact_person, phone = :phone, email = :email, address = :address, gps_lat = :gps_lat, gps_lng = :gps_lng, delivery_instructions = :delivery_instructions WHERE id = :id";
        $stmt = $this->db->prepare($query);

        $stmt->bindParam(':company_name', $data['company_name']);
        $stmt->bindParam(':contact_person', $data['contact_person']);
        $stmt->bindParam(':phone', $data['phone']);
        $stmt->bindParam(':email', $data['email']);
        $stmt->bindParam(':address', $data['address']);
        $stmt->bindParam(':gps_lat', $data['gps_lat']);
        $stmt->bindParam(':gps_lng', $data['gps_lng']);
        $stmt->bindParam(':delivery_instructions', $data['delivery_instructions']);
        $stmt->bindParam(':id', $id);

        return $stmt->execute();
    }
}
