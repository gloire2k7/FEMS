<?php
/**
 * FEMS v2 migration — permissions, client approval, order fields, stock log, superadmin seed.
 * Run once: php database/migrate_v2.php  OR open in browser.
 */
require_once __DIR__ . '/../config/database.php';

$pdo = Database::getConnection();
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$queries = [
    "ALTER TABLE users MODIFY status ENUM('active','inactive','pending') DEFAULT 'pending'",
    "ALTER TABLE fire_extinguishers ADD COLUMN price DECIMAL(10,2) DEFAULT 0.00",
    "ALTER TABLE fire_extinguishers ADD COLUMN label_pdf_path VARCHAR(255) NULL",
    "ALTER TABLE orders ADD COLUMN unit_price DECIMAL(10,2) DEFAULT 0.00",
    "ALTER TABLE orders ADD COLUMN total_price DECIMAL(10,2) DEFAULT 0.00",
    "ALTER TABLE orders ADD COLUMN delivery_address TEXT NULL",
    "ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50) NULL",
    "ALTER TABLE orders ADD COLUMN notes TEXT NULL",
    "ALTER TABLE orders ADD COLUMN denial_reason TEXT NULL",
    "ALTER TABLE orders ADD COLUMN delivered_at TIMESTAMP NULL",
    "CREATE TABLE IF NOT EXISTS permissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        `key` VARCHAR(50) NOT NULL UNIQUE,
        label VARCHAR(100) NOT NULL,
        description VARCHAR(255) NULL
    )",
    "CREATE TABLE IF NOT EXISTS user_permissions (
        user_id INT NOT NULL,
        permission_id INT NOT NULL,
        PRIMARY KEY (user_id, permission_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
    )",
    "CREATE TABLE IF NOT EXISTS stock_movements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        extinguisher_id INT NULL,
        action VARCHAR(50) NOT NULL,
        performed_by INT NOT NULL,
        details TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (extinguisher_id) REFERENCES fire_extinguishers(id) ON DELETE SET NULL,
        FOREIGN KEY (performed_by) REFERENCES users(id)
    )",
];

$permInserts = [
    ['manage_stock', 'Manage Stock', 'Register units, view inventory, generate QR/labels'],
    ['manage_orders', 'Manage Orders', 'Approve, deny, and deliver client orders'],
    ['approve_clients', 'Approve Clients', 'Review and approve new client registrations'],
    ['manage_admins', 'Manage Admins', 'Create and manage admin accounts'],
    ['view_analytics', 'View Analytics', 'Access dashboard analytics and reports'],
    ['manage_inspections', 'Manage Inspections', 'Assign and review inspections'],
];

echo "<h1>FEMS v2 Migration</h1><ul>";

foreach ($queries as $q) {
    try {
        $pdo->exec($q);
        echo "<li style='color:green'>OK: " . htmlspecialchars(substr($q, 0, 80)) . "…</li>";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate column') !== false || $e->getMessage() === '') {
            echo "<li style='color:orange'>Skip (exists): " . htmlspecialchars(substr($q, 0, 60)) . "…</li>";
        } else {
            echo "<li style='color:orange'>Note: " . htmlspecialchars($e->getMessage()) . "</li>";
        }
    }
}

foreach ($permInserts as [$key, $label, $desc]) {
    $stmt = $pdo->prepare("INSERT IGNORE INTO permissions (`key`, label, description) VALUES (?, ?, ?)");
    $stmt->execute([$key, $label, $desc]);
}
echo "<li style='color:green'>Permissions seeded</li>";

// Seed super admin (superadmin@fems.com / SuperAdmin@123)
$email = 'superadmin@fems.com';
$hash = password_hash('SuperAdmin@123', PASSWORD_DEFAULT);
$stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
$stmt->execute([$email]);
if (!$stmt->fetch()) {
    $pdo->prepare("INSERT INTO users (name, email, password, role_id, status) VALUES ('Super Admin', ?, ?, 1, 'active')")
        ->execute([$email, $hash]);
    echo "<li style='color:green'>Super Admin created: superadmin@fems.com / SuperAdmin@123</li>";
} else {
    $pdo->prepare("UPDATE users SET password = ?, status = 'active', role_id = 1 WHERE email = ?")
        ->execute([$hash, $email]);
    echo "<li style='color:green'>Super Admin updated: superadmin@fems.com / SuperAdmin@123</li>";
}

echo "</ul><p><strong>Done.</strong> Super Admin login: <code>superadmin@fems.com</code> / <code>SuperAdmin@123</code></p>";
