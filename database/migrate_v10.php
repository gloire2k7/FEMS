<?php
/**
 * FEMS v10: Client email verification.
 *  - Adds users.email_verified flag
 *  - Adds email_verification_tokens table (OTP for client self-registration)
 * Run: php database/migrate_v10.php
 */
require_once __DIR__ . '/../config/database.php';

$pdo = Database::getConnection();
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

echo "<h1>FEMS v10 Migration — Client email verification</h1><ul>";

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

$cols = $pdo->query("SHOW COLUMNS FROM users")->fetchAll(PDO::FETCH_COLUMN);

if (!in_array('email_verified', $cols, true)) {
    run($pdo, 'Add users.email_verified', "ALTER TABLE users ADD COLUMN email_verified TINYINT(1) NOT NULL DEFAULT 0 AFTER status");
    // Existing accounts are considered already verified so they are not locked out.
    run($pdo, 'Mark existing users verified', "UPDATE users SET email_verified = 1");
} else {
    echo "<li style='color:orange'>Skip: users.email_verified already exists</li>";
}

run($pdo, 'Create email_verification_tokens table',
    "CREATE TABLE IF NOT EXISTS email_verification_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        otp_hash CHAR(64) NOT NULL,
        expires_at DATETIME NOT NULL,
        used_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_ev_user (user_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )"
);

echo "</ul><p><strong>Done.</strong></p>";
