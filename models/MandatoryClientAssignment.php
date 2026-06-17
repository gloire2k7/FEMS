<?php

class MandatoryClientAssignment extends Model
{
    protected $table = 'mandatory_client_assignments';

    private function baseSelect()
    {
        return "SELECT mca.*,
                mit.name AS mandatory_name, mit.interval_months, mit.deadline_days,
                c.company_name, c.email AS client_email, c.contact_person,
                u.name AS inspector_name, u.email AS inspector_email
                FROM {$this->table} mca
                JOIN mandatory_inspection_types mit ON mit.id = mca.mandatory_type_id
                JOIN clients c ON c.id = mca.client_id
                JOIN users u ON u.id = mca.inspector_id";
    }

    public function findById($id)
    {
        $stmt = $this->db->prepare($this->baseSelect() . " WHERE mca.id = :id LIMIT 1");
        $stmt->bindValue(':id', (int) $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function findAllWithDetails()
    {
        return $this->db->query($this->baseSelect() . " ORDER BY mit.name, c.company_name")->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findByInspector($inspectorId)
    {
        $stmt = $this->db->prepare($this->baseSelect() . " WHERE mca.inspector_id = :inspector_id ORDER BY mit.name, c.company_name");
        $stmt->bindValue(':inspector_id', (int) $inspectorId, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findByTypeAndClient($typeId, $clientId)
    {
        $stmt = $this->db->prepare(
            $this->baseSelect() . " WHERE mca.mandatory_type_id = :type_id AND mca.client_id = :client_id LIMIT 1"
        );
        $stmt->bindValue(':type_id', (int) $typeId, PDO::PARAM_INT);
        $stmt->bindValue(':client_id', (int) $clientId, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function upsert($typeId, $clientId, $inspectorId)
    {
        $existing = $this->findByTypeAndClient($typeId, $clientId);
        if ($existing) {
            $stmt = $this->db->prepare(
                "UPDATE {$this->table} SET inspector_id = :inspector_id WHERE id = :id"
            );
            $stmt->bindValue(':inspector_id', (int) $inspectorId, PDO::PARAM_INT);
            $stmt->bindValue(':id', (int) $existing['id'], PDO::PARAM_INT);
            $stmt->execute();
            return (int) $existing['id'];
        }
        $stmt = $this->db->prepare(
            "INSERT INTO {$this->table} (mandatory_type_id, client_id, inspector_id) VALUES (:type_id, :client_id, :inspector_id)"
        );
        $stmt->bindValue(':type_id', (int) $typeId, PDO::PARAM_INT);
        $stmt->bindValue(':client_id', (int) $clientId, PDO::PARAM_INT);
        $stmt->bindValue(':inspector_id', (int) $inspectorId, PDO::PARAM_INT);
        return $stmt->execute() ? (int) $this->db->lastInsertId() : false;
    }

    public function delete($id)
    {
        $stmt = $this->db->prepare("DELETE FROM {$this->table} WHERE id = :id");
        $stmt->bindValue(':id', (int) $id, PDO::PARAM_INT);
        return $stmt->execute() && $stmt->rowCount() > 0;
    }

    public function updateLastCompleted($id, $date)
    {
        $stmt = $this->db->prepare("UPDATE {$this->table} SET last_completed_at = :date WHERE id = :id");
        $stmt->bindValue(':date', $date);
        $stmt->bindValue(':id', (int) $id, PDO::PARAM_INT);
        $stmt->execute();
    }
}
