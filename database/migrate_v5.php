<?php
/**
 * FEMS v5: Client service requests + service fees.
 * Run: php database/migrate_v5.php
 */
require_once __DIR__ . '/../config/database.php';

$pdo = Database::getConnection();
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

echo "<h1>FEMS v5 Migration</h1><ul>";

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

run($pdo, 'Create service_requests table',
    "CREATE TABLE IF NOT EXISTS service_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_id INT NOT NULL,
        extinguisher_id INT NOT NULL,
        service_type ENUM('inspection', 'refill', 'maintenance') NOT NULL,
        status ENUM('pending', 'scheduled', 'awaiting_client', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
        preferred_date DATE NULL,
        confirmed_date DATE NULL,
        inspector_id INT NULL,
        assigned_by INT NULL,
        fee DECIMAL(10,2) NULL,
        client_notes TEXT NULL,
        inspector_notes TEXT NULL,
        result_status ENUM('passed', 'requires_refill', 'expired', 'condemned') NULL,
        client_confirmed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
        FOREIGN KEY (extinguisher_id) REFERENCES fire_extinguishers(id) ON DELETE CASCADE,
        FOREIGN KEY (inspector_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
    )"
);

run($pdo, 'Create service_fees table',
    "CREATE TABLE IF NOT EXISTS service_fees (
        id INT AUTO_INCREMENT PRIMARY KEY,
        service_type ENUM('refill', 'maintenance') NOT NULL UNIQUE,
        fee_per_unit DECIMAL(10,2) NOT NULL DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )"
);

run($pdo, 'Seed service fees',
    "INSERT IGNORE INTO service_fees (service_type, fee_per_unit) VALUES ('refill', 15000), ('maintenance', 25000)"
);

run($pdo, 'Add service_request_id to inspection_assignments',
    "ALTER TABLE inspection_assignments ADD COLUMN service_request_id INT NULL AFTER id"
);

echo "</ul><p><strong>Done.</strong></p>";
