<?php
/**
 * FEMS v4 — product pricing matrix, order workflow fields.
 * Run: php database/migrate_v4.php
 */
require_once __DIR__ . '/../config/database.php';

$pdo = Database::getConnection();
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

echo "<h1>FEMS v4 Migration</h1><ul>";

function run($pdo, $label, $sql) {
    try {
        $pdo->exec($sql);
        echo "<li style='color:green'>OK: $label</li>";
    } catch (PDOException $e) {
        $msg = $e->getMessage();
        if (strpos($msg, 'Duplicate') !== false || strpos($msg, 'already exists') !== false) {
            echo "<li style='color:orange'>Skip: $label</li>";
        } else {
            echo "<li style='color:red'>ERROR: $label — $msg</li>";
        }
    }
}

run($pdo, 'Create product_prices table', "
    CREATE TABLE IF NOT EXISTS product_prices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        capacity VARCHAR(10) NOT NULL,
        price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_type_capacity (type, capacity)
    )
");

run($pdo, 'Add expected_delivery_date to orders', "
    ALTER TABLE orders ADD COLUMN expected_delivery_date DATE NULL
");

run($pdo, 'Add granted_quantity to orders', "
    ALTER TABLE orders ADD COLUMN granted_quantity INT NULL
");

run($pdo, 'Add parent_order_id to orders', "
    ALTER TABLE orders ADD COLUMN parent_order_id INT NULL
");

run($pdo, 'Add client_confirmed_at to orders', "
    ALTER TABLE orders ADD COLUMN client_confirmed_at TIMESTAMP NULL
");

$types = ['Water', 'CO2', 'Powder', 'Foam'];
$capacities = ['6', '9', '12'];
$defaults = [
    'Water'  => ['6' => 45000, '9' => 65000, '12' => 85000],
    'CO2'    => ['6' => 55000, '9' => 75000, '12' => 95000],
    'Powder' => ['6' => 40000, '9' => 60000, '12' => 80000],
    'Foam'   => ['6' => 50000, '9' => 70000, '12' => 90000],
];

$stmt = $pdo->prepare("INSERT IGNORE INTO product_prices (type, capacity, price) VALUES (?, ?, ?)");
foreach ($types as $type) {
    foreach ($capacities as $cap) {
        $stmt->execute([$type, $cap, $defaults[$type][$cap]]);
    }
}
echo "<li style='color:green'>OK: Seed product_prices</li>";
echo "</ul><p><strong>Done.</strong></p>";
