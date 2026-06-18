<?php
/**
 * FEMS v9: Password reset tokens.
 * Run: php database/migrate_v9.php
 */
require_once __DIR__ . '/../config/database.php';

$pdo = Database::getConnection();
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

echo "<h1>FEMS v9 Migration — Password reset</h1><ul>";

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

run($pdo, 'Create password_reset_tokens table',
    "CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token_hash CHAR(64) NOT NULL,
        expires_at DATETIME NOT NULL,
        used_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_reset_token_hash (token_hash),
        INDEX idx_reset_user (user_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )"
);

echo "</ul><p><strong>Done.</strong></p>";
