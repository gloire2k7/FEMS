<?php

class User extends Model
{
    protected $table = 'users';

    public function findByEmail($email)
    {
        $query = "SELECT * FROM " . $this->table . " WHERE email = :email LIMIT 1";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':email', $email);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function create($data)
    {
        $query = "INSERT INTO " . $this->table . " (name, email, password, role_id, company_id, status) VALUES (:name, :email, :password, :role_id, :company_id, :status)";
        $stmt = $this->db->prepare($query);

        $hashed_password = password_hash($data['password'], PASSWORD_DEFAULT);
        $status = isset($data['status']) ? $data['status'] : 'active';
        $company_id = isset($data['company_id']) ? $data['company_id'] : null;

        $stmt->bindParam(':name', $data['name']);
        $stmt->bindParam(':email', $data['email']);
        $stmt->bindParam(':password', $hashed_password);
        $stmt->bindParam(':role_id', $data['role_id']);
        $stmt->bindParam(':company_id', $company_id);
        $stmt->bindParam(':status', $status);

        if ($stmt->execute()) {
            return $this->db->lastInsertId();
        }
        return false;
    }

    public function update($id, $data)
    {
        $query = "UPDATE " . $this->table . " SET name = :name, role_id = :role_id, company_id = :company_id, status = :status WHERE id = :id";
        $stmt = $this->db->prepare($query);

        $stmt->bindParam(':name', $data['name']);
        $stmt->bindParam(':role_id', $data['role_id']);
        $stmt->bindParam(':company_id', $data['company_id']);
        $stmt->bindParam(':status', $data['status']);
        $stmt->bindParam(':id', $id);

        return $stmt->execute();
    }
}
