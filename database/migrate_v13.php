<?php
/**
 * FEMS v13: Anti-lockout safeguard for permission-driven Super Admins.
 *
 * Permission checks are now effective for everyone, including Super Admins
 * (they can revoke their own permissions). To make sure no Super Admin can
 * ever be locked out of the access-control screen, every Super Admin is
 * guaranteed to keep `permissions.manage`. Additive + idempotent — it never
 * touches any other permission, so a Super Admin's deliberate revocations of
 * other features are preserved.
 *
 * Run: php database/migrate_v13.php
 */
require_once __DIR__ . '/../config/database.php';

$pdo = Database::getConnection();
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

echo "<h1>FEMS v13 Migration — Super Admin anti-lockout</h1><ul>";

$stmt = $pdo->prepare(
    "INSERT IGNORE INTO user_permissions (user_id, permission_id)
     SELECT u.id, p.id
     FROM users u
     JOIN roles r ON r.id = u.role_id
     JOIN permissions p ON p.`key` = 'permissions.manage'
     WHERE r.name = 'Super Admin'"
);
$stmt->execute();
echo "<li style='color:green'>OK: Guaranteed permissions.manage for Super Admins ({$stmt->rowCount()} grants)</li>";

echo "</ul><p><strong>Done.</strong></p>";
