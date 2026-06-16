<?php
/**
 * FEMS v4 migration: Inspector role, manage_inspectors permission, inspection assignments.
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
        if (
            strpos($msg, 'Duplicate column') !== false ||
            strpos($msg, 'Duplicate entry') !== false ||
            strpos($msg, 'already exists') !== false
        ) {
            echo "<li style='color:orange'>Skip (exists): $label</li>";
        } else {
            echo "<li style='color:red'>ERROR: $label — $msg</li>";
        }
    }
}

run($pdo, 'Add Inspector role',
    "INSERT IGNORE INTO roles (name) VALUES ('Inspector')"
);

run($pdo, 'Add manage_inspectors permission',
    "INSERT IGNORE INTO permissions (`key`, label, description)
     VALUES ('manage_inspectors', 'Inspectors Management', 'Create and manage field inspectors')"
);

run($pdo, 'Create inspection_assignments table',
    "CREATE TABLE IF NOT EXISTS inspection_assignments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        extinguisher_id INT NOT NULL,
        inspector_id INT NULL,
        assigned_by INT NULL,
        status ENUM('pending', 'assigned', 'completed') NOT NULL DEFAULT 'pending',
        due_date DATE NULL,
        notes TEXT NULL,
        result_status ENUM('passed', 'requires_refill', 'expired', 'condemned') NULL,
        inspection_date DATE NULL,
        completed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (extinguisher_id) REFERENCES fire_extinguishers(id) ON DELETE CASCADE,
        FOREIGN KEY (inspector_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
    )"
);

run($pdo, 'Add user_id to generated_reports',
    "ALTER TABLE generated_reports ADD COLUMN user_id INT NULL AFTER id"
);

echo "</ul><p><strong>Done.</strong></p>";
