<?php

class MandatoryInspectionType extends Model
{
    protected $table = 'mandatory_inspection_types';

    public function findAll()
    {
        return $this->db->query("SELECT * FROM {$this->table} ORDER BY name")->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findById($id)
    {
        $stmt = $this->db->prepare("SELECT * FROM {$this->table} WHERE id = :id");
        $stmt->bindValue(':id', (int) $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function create($data)
    {
        $stmt = $this->db->prepare(
            "INSERT INTO {$this->table} (name, interval_months, deadline_days) VALUES (:name, :interval_months, :deadline_days)"
        );
        $stmt->bindValue(':name', trim($data['name']));
        $stmt->bindValue(':interval_months', (int) $data['interval_months'], PDO::PARAM_INT);
        $stmt->bindValue(':deadline_days', (int) ($data['deadline_days'] ?? 30), PDO::PARAM_INT);
        return $stmt->execute() ? (int) $this->db->lastInsertId() : false;
    }

    public function update($id, $data)
    {
        $stmt = $this->db->prepare(
            "UPDATE {$this->table} SET name = :name, interval_months = :interval_months, deadline_days = :deadline_days WHERE id = :id"
        );
        $stmt->bindValue(':name', trim($data['name']));
        $stmt->bindValue(':interval_months', (int) $data['interval_months'], PDO::PARAM_INT);
        $stmt->bindValue(':deadline_days', (int) ($data['deadline_days'] ?? 30), PDO::PARAM_INT);
        $stmt->bindValue(':id', (int) $id, PDO::PARAM_INT);
        return $stmt->execute() && $stmt->rowCount() > 0;
    }

    public function delete($id)
    {
        $stmt = $this->db->prepare("DELETE FROM {$this->table} WHERE id = :id");
        $stmt->bindValue(':id', (int) $id, PDO::PARAM_INT);
        return $stmt->execute() && $stmt->rowCount() > 0;
    }
}
