<?php

class Inspection extends Model
{
    protected $table = 'inspections';

    public function create($data)
    {
        $query = "INSERT INTO " . $this->table . " 
        (extinguisher_id, inspector_id, pressure_level, weight, physical_condition, seal_status, hose_condition, bracket_condition, result_status, inspection_date, next_due_date, notes) 
        VALUES (:extinguisher_id, :inspector_id, :pressure_level, :weight, :physical_condition, :seal_status, :hose_condition, :bracket_condition, :result_status, :inspection_date, :next_due_date, :notes)";

        $stmt = $this->db->prepare($query);

        $stmt->bindParam(':extinguisher_id', $data['extinguisher_id']);
        $stmt->bindParam(':inspector_id', $data['inspector_id']);
        $stmt->bindParam(':pressure_level', $data['pressure_level']);
        $stmt->bindParam(':weight', $data['weight']);
        $stmt->bindParam(':physical_condition', $data['physical_condition']);
        $stmt->bindParam(':seal_status', $data['seal_status']);
        $stmt->bindParam(':hose_condition', $data['hose_condition']);
        $stmt->bindParam(':bracket_condition', $data['bracket_condition']);
        $stmt->bindParam(':result_status', $data['result_status']);
        $stmt->bindParam(':inspection_date', $data['inspection_date']);
        $stmt->bindParam(':next_due_date', $data['next_due_date']);
        $stmt->bindParam(':notes', $data['notes']);

        if ($stmt->execute()) {
            return $this->db->lastInsertId();
        }
        return false;
    }
}
