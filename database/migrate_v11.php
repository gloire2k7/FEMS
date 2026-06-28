<?php
/**
 * FEMS v11: Granular permission catalog.
 *  - Adds permissions.group_name + sort_order
 *  - Seeds the full grouped catalog (config/permissions_catalog.php)
 *  - Maps legacy permission keys -> new bundles (additive; legacy rows kept
 *    until enforcement is migrated, so nobody loses access)
 *  - Grants default bundles to existing Company Users & Inspectors
 *  - Grants every permission to Super Admins
 *
 * Idempotent. Run: php database/migrate_v11.php
 */
require_once __DIR__ . '/../config/database.php';

$pdo = Database::getConnection();
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$catalog = require __DIR__ . '/../config/permissions_catalog.php';

echo "<h1>FEMS v11 Migration — Granular permissions</h1><ul>";

function step($label, callable $fn) {
    try {
        $fn();
        echo "<li style='color:green'>OK: $label</li>";
    } catch (PDOException $e) {
        $msg = $e->getMessage();
        if (strpos($msg, 'Duplicate column') !== false || strpos($msg, 'already exists') !== false) {
            echo "<li style='color:orange'>Skip: $label</li>";
        } else {
            echo "<li style='color:red'>ERROR: $label — $msg</li>";
        }
    }
}

// 1. Schema: group_name + sort_order
$cols = $pdo->query("SHOW COLUMNS FROM permissions")->fetchAll(PDO::FETCH_COLUMN);
if (!in_array('group_name', $cols, true)) {
    step('Add permissions.group_name', fn() => $pdo->exec("ALTER TABLE permissions ADD COLUMN group_name VARCHAR(80) NULL AFTER description"));
}
if (!in_array('sort_order', $cols, true)) {
    step('Add permissions.sort_order', fn() => $pdo->exec("ALTER TABLE permissions ADD COLUMN sort_order INT NOT NULL DEFAULT 0"));
}

// 2. Seed catalog (upsert)
$upsert = $pdo->prepare(
    "INSERT INTO permissions (`key`, label, description, group_name, sort_order)
     VALUES (:key, :label, :description, :group_name, :sort_order)
     ON DUPLICATE KEY UPDATE label = VALUES(label), description = VALUES(description),
        group_name = VALUES(group_name), sort_order = VALUES(sort_order)"
);
$sort = 0;
$seeded = 0;
foreach ($catalog['groups'] as $group => $perms) {
    foreach ($perms as [$key, $label, $desc]) {
        $upsert->execute([
            ':key' => $key, ':label' => $label, ':description' => $desc,
            ':group_name' => $group, ':sort_order' => $sort++,
        ]);
        $seeded++;
    }
}
echo "<li style='color:green'>OK: Seeded/updated $seeded catalog permissions</li>";

// 3. Migrate legacy assignments -> new bundles (additive)
$mapStmt = $pdo->prepare(
    "INSERT IGNORE INTO user_permissions (user_id, permission_id)
     SELECT up.user_id, pnew.id
     FROM user_permissions up
     JOIN permissions pold ON pold.id = up.permission_id AND pold.`key` = :legacy
     JOIN permissions pnew ON pnew.`key` = :newkey"
);
$migrated = 0;
foreach ($catalog['legacy_map'] as $legacy => $newKeys) {
    foreach ($newKeys as $newKey) {
        $mapStmt->execute([':legacy' => $legacy, ':newkey' => $newKey]);
        $migrated += $mapStmt->rowCount();
    }
}
echo "<li style='color:green'>OK: Migrated legacy assignments ($migrated new grants)</li>";

// 4. Role default bundles for existing Company Users & Inspectors (had none)
$roleStmt = $pdo->prepare(
    "INSERT IGNORE INTO user_permissions (user_id, permission_id)
     SELECT u.id, p.id
     FROM users u
     JOIN roles r ON r.id = u.role_id AND r.name = :role
     JOIN permissions p ON p.`key` = :key"
);
foreach (['Company User', 'Inspector'] as $role) {
    $keys = $catalog['role_defaults'][$role] ?? [];
    $count = 0;
    foreach ($keys as $key) {
        $roleStmt->execute([':role' => $role, ':key' => $key]);
        $count += $roleStmt->rowCount();
    }
    echo "<li style='color:green'>OK: Default bundle for $role ($count grants)</li>";
}

// 5. Super Admins get everything (they bypass too, but keep it explicit)
step('Grant all permissions to Super Admins', function () use ($pdo) {
    $pdo->exec(
        "INSERT IGNORE INTO user_permissions (user_id, permission_id)
         SELECT u.id, p.id
         FROM users u
         JOIN roles r ON r.id = u.role_id AND r.name = 'Super Admin'
         CROSS JOIN permissions p"
    );
});

echo "</ul><p><strong>Done.</strong> Legacy keys retained until backend enforcement is migrated.</p>";
