<?php
/**
 * FEMS v6: Service request batches + mandatory inspections.
 * Run: php database/migrate_v6.php
 */
require_once __DIR__ . '/../config/database.php';

$pdo = Database::getConnection();
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

echo "<h1>FEMS v6 Migration</h1><ul>";

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

run($pdo, 'Create service_request_batches',
    "CREATE TABLE IF NOT EXISTS service_request_batches (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_id INT NOT NULL,
        service_type ENUM('inspection', 'refill', 'maintenance') NOT NULL,
        status ENUM('pending', 'scheduled', 'awaiting_client', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
        preferred_date DATE NULL,
        confirmed_date DATE NULL,
        inspector_id INT NULL,
        assigned_by INT NULL,
        client_notes TEXT NULL,
        unit_count INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
        FOREIGN KEY (inspector_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
    )"
);

run($pdo, 'Add batch_id to service_requests',
    "ALTER TABLE service_requests ADD COLUMN batch_id INT NULL AFTER id"
);

run($pdo, 'Extend service_type enum',
    "ALTER TABLE service_requests MODIFY service_type ENUM('inspection', 'refill', 'maintenance', 'mandatory') NOT NULL"
);

run($pdo, 'Add mandatory_instance_id to service_requests',
    "ALTER TABLE service_requests ADD COLUMN mandatory_instance_id INT NULL AFTER batch_id"
);

run($pdo, 'Create mandatory_inspection_types',
    "CREATE TABLE IF NOT EXISTS mandatory_inspection_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        interval_months INT NOT NULL,
        deadline_days INT NOT NULL DEFAULT 30,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )"
);

run($pdo, 'Create mandatory_client_assignments',
    "CREATE TABLE IF NOT EXISTS mandatory_client_assignments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        mandatory_type_id INT NOT NULL,
        client_id INT NOT NULL,
        inspector_id INT NOT NULL,
        last_completed_at DATE NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_mandatory_client (mandatory_type_id, client_id),
        FOREIGN KEY (mandatory_type_id) REFERENCES mandatory_inspection_types(id) ON DELETE CASCADE,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
        FOREIGN KEY (inspector_id) REFERENCES users(id) ON DELETE CASCADE
    )"
);

run($pdo, 'Create mandatory_inspection_instances',
    "CREATE TABLE IF NOT EXISTS mandatory_inspection_instances (
        id INT AUTO_INCREMENT PRIMARY KEY,
        assignment_id INT NOT NULL,
        due_date DATE NOT NULL,
        deadline_date DATE NOT NULL,
        status ENUM('scheduled', 'awaiting_client', 'completed') NOT NULL DEFAULT 'scheduled',
        inspector_notes TEXT NULL,
        result_status ENUM('passed', 'requires_refill', 'expired', 'condemned') NULL,
        completed_at TIMESTAMP NULL,
        client_confirmed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (assignment_id) REFERENCES mandatory_client_assignments(id) ON DELETE CASCADE
    )"
);

// Backfill batches for existing service_requests without batch_id
try {
    $rows = $pdo->query("SELECT * FROM service_requests WHERE batch_id IS NULL")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($rows as $sr) {
        if ($sr['service_type'] === 'mandatory') {
            continue;
        }
        $pdo->prepare(
            "INSERT INTO service_request_batches (client_id, service_type, status, preferred_date, confirmed_date, inspector_id, assigned_by, client_notes, unit_count)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)"
        )->execute([
            $sr['client_id'], $sr['service_type'], $sr['status'], $sr['preferred_date'],
            $sr['confirmed_date'], $sr['inspector_id'], $sr['assigned_by'], $sr['client_notes']
        ]);
        $batchId = (int) $pdo->lastInsertId();
        $pdo->prepare("UPDATE service_requests SET batch_id = ? WHERE id = ?")->execute([$batchId, $sr['id']]);
    }
    if (count($rows)) {
        echo "<li style='color:green'>OK: Backfilled batches for existing service requests</li>";
    }
} catch (PDOException $e) {
    echo "<li style='color:orange'>Skip backfill: " . htmlspecialchars($e->getMessage()) . "</li>";
}

echo "</ul><p><strong>Done.</strong> Run after migrate_v5.</p>";
