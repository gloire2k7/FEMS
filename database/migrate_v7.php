<?php
/**
 * FEMS v7: Extended notifications table.
 * Run: php database/migrate_v7.php
 */
require_once __DIR__ . '/../config/database.php';

$pdo = Database::getConnection();
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

echo "<h1>FEMS v7 Migration</h1><ul>";

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

run($pdo, 'Extend notifications table',
    "ALTER TABLE notifications
     ADD COLUMN title VARCHAR(255) NULL AFTER user_id,
     ADD COLUMN link VARCHAR(255) NULL AFTER message,
     ADD COLUMN entity_type VARCHAR(50) NULL AFTER link,
     ADD COLUMN entity_id INT NULL AFTER entity_type,
     ADD COLUMN dedupe_key VARCHAR(120) NULL AFTER entity_id"
);

run($pdo, 'Add dedupe index',
    "CREATE UNIQUE INDEX uq_notifications_dedupe ON notifications (user_id, dedupe_key)"
);

echo "</ul><p><strong>Done.</strong></p>";
