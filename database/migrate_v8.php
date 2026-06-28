<?php
/**
 * FEMS v8: Activity / audit logs.
 * Run: php database/migrate_v8.php
 */
require_once __DIR__ . '/../config/database.php';

$pdo = Database::getConnection();
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

echo "<h1>FEMS v8 Migration — Activity logs</h1><ul>";

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

run($pdo, 'Create audit_logs table',
    "CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        action VARCHAR(50) NOT NULL,
        entity_type VARCHAR(100) NOT NULL,
        entity_id INT NULL,
        entity_label VARCHAR(255) NULL,
        details TEXT NULL,
        ip_address VARCHAR(45) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_audit_created (created_at),
        INDEX idx_audit_action (action),
        INDEX idx_audit_entity (entity_type),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )"
);

// Upgrade legacy schema (table_name / record_id)
$cols = $pdo->query("SHOW COLUMNS FROM audit_logs")->fetchAll(PDO::FETCH_COLUMN);
if (in_array('table_name', $cols, true) && !in_array('entity_type', $cols, true)) {
    run($pdo, 'Rename table_name → entity_type', "ALTER TABLE audit_logs CHANGE table_name entity_type VARCHAR(100) NOT NULL");
}
if (in_array('record_id', $cols, true) && !in_array('entity_id', $cols, true)) {
    run($pdo, 'Rename record_id → entity_id', "ALTER TABLE audit_logs CHANGE record_id entity_id INT NULL");
}

$cols = $pdo->query("SHOW COLUMNS FROM audit_logs")->fetchAll(PDO::FETCH_COLUMN);
if (!in_array('entity_label', $cols, true)) {
    run($pdo, 'Add entity_label', "ALTER TABLE audit_logs ADD COLUMN entity_label VARCHAR(255) NULL AFTER entity_id");
}
if (!in_array('details', $cols, true)) {
    run($pdo, 'Add details', "ALTER TABLE audit_logs ADD COLUMN details TEXT NULL AFTER entity_label");
}
if (!in_array('ip_address', $cols, true)) {
    run($pdo, 'Add ip_address', "ALTER TABLE audit_logs ADD COLUMN ip_address VARCHAR(45) NULL AFTER details");
}

echo "</ul><p><strong>Done.</strong></p>";
