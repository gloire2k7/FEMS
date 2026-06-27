<?php
/**
 * FEMS v12: Unified portal baseline permissions.
 *
 * With the single permission-driven portal, the sidebar/dashboard rely on the
 * baseline "General" permissions. Existing Admins never had these stored
 * (they were always-on in the old role-specific UI), so grant them now so the
 * unified sidebar shows Dashboard/Notifications/Settings/AI for everyone who
 * had them before. Additive + idempotent — nobody loses access.
 *
 *  - Grants dashboard.view, notifications.view, settings.view to ALL users
 *  - Grants ai_assistant.use to all non-Inspector users (Inspectors had no AI)
 *
 * Run: php database/migrate_v12.php
 */
require_once __DIR__ . '/../config/database.php';

$pdo = Database::getConnection();
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

echo "<h1>FEMS v12 Migration — Unified portal baseline</h1><ul>";

// 1. Baseline General permissions for every user.
$base = ['dashboard.view', 'notifications.view', 'settings.view'];
$baseStmt = $pdo->prepare(
    "INSERT IGNORE INTO user_permissions (user_id, permission_id)
     SELECT u.id, p.id
     FROM users u
     JOIN permissions p ON p.`key` = :key"
);
$baseGrants = 0;
foreach ($base as $key) {
    $baseStmt->execute([':key' => $key]);
    $baseGrants += $baseStmt->rowCount();
}
echo "<li style='color:green'>OK: Baseline General permissions ($baseGrants grants)</li>";

// 2. AI assistant for everyone except Inspectors (preserves prior behavior).
$aiStmt = $pdo->prepare(
    "INSERT IGNORE INTO user_permissions (user_id, permission_id)
     SELECT u.id, p.id
     FROM users u
     JOIN roles r ON r.id = u.role_id
     JOIN permissions p ON p.`key` = 'ai_assistant.use'
     WHERE r.name <> 'Inspector'"
);
$aiStmt->execute();
echo "<li style='color:green'>OK: AI assistant for non-Inspector users ({$aiStmt->rowCount()} grants)</li>";

echo "</ul><p><strong>Done.</strong></p>";
