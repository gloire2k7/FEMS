<?php

class ServiceFee extends Model
{
    protected $table = 'service_fees';

    public function getAll()
    {
        return $this->db->query("SELECT * FROM {$this->table} ORDER BY service_type")->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getFee($serviceType)
    {
        $stmt = $this->db->prepare("SELECT fee_per_unit FROM {$this->table} WHERE service_type = ? LIMIT 1");
        $stmt->execute([$serviceType]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ? (float) $row['fee_per_unit'] : 0;
    }

    public function updateFees($refillFee, $maintenanceFee)
    {
        $stmt = $this->db->prepare("UPDATE {$this->table} SET fee_per_unit = ? WHERE service_type = ?");
        $stmt->execute([(float) $refillFee, 'refill']);
        $stmt->execute([(float) $maintenanceFee, 'maintenance']);
        return true;
    }
}
