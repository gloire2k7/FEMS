<?php

class ProductPrice extends Model
{
    protected $table = 'product_prices';

    public const TYPES = ['Water', 'CO2', 'Powder', 'Foam'];
    public const CAPACITIES = ['6', '9', '12'];

    public function findAll()
    {
        $stmt = $this->db->query(
            "SELECT * FROM {$this->table} ORDER BY FIELD(type, 'Water', 'CO2', 'Powder', 'Foam'), CAST(capacity AS UNSIGNED)"
        );
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findByTypeCapacity($type, $capacity)
    {
        $capacity = $this->normalizeCapacity($capacity);
        $stmt = $this->db->prepare(
            "SELECT * FROM {$this->table} WHERE type = :type AND capacity = :capacity LIMIT 1"
        );
        $stmt->execute([':type' => $type, ':capacity' => $capacity]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function getPrice($type, $capacity)
    {
        $row = $this->findByTypeCapacity($type, $capacity);
        return $row ? (float) $row['price'] : null;
    }

    public function upsert($type, $capacity, $price)
    {
        $capacity = $this->normalizeCapacity($capacity);
        $stmt = $this->db->prepare(
            "INSERT INTO {$this->table} (type, capacity, price) VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE price = VALUES(price)"
        );
        return $stmt->execute([$type, $capacity, $price]);
    }

    public function bulkUpdate(array $items)
    {
        foreach ($items as $item) {
            if (empty($item['type']) || empty($item['capacity']) || !isset($item['price'])) {
                continue;
            }
            $this->upsert($item['type'], $item['capacity'], (float) $item['price']);
        }
        return true;
    }

    public function normalizeCapacity($capacity)
    {
        $cap = preg_replace('/[^0-9]/', '', (string) $capacity);
        return in_array($cap, self::CAPACITIES, true) ? $cap : $cap;
    }

    public function validateType($type)
    {
        return in_array($type, self::TYPES, true);
    }

    public function validateCapacity($capacity)
    {
        return in_array($this->normalizeCapacity($capacity), self::CAPACITIES, true);
    }
}
