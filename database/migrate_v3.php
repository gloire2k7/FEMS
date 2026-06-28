<?php
/**
 * FEMS v3 migration:
 * - Renames permission keys to match sidebar items exactly
 * - Adds 5 new sidebar-mapped permissions
 * - Drops unused permissions (manage_admins, view_analytics)
 * - Adds must_change_password column to users
 * Run: php database/migrate_v3.php
 */
require_once __DIR__ . '/../config/database.php';

$pdo = Database::getConnection();
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

echo "<h1>FEMS v3 Migration</h1><ul>";

function run($pdo, $label, $sql) {
    try {
        $pdo->exec($sql);
        echo "<li style='color:green'>OK: $label</li>";
    } catch (PDOException $e) {
        $msg = $e->getMessage();
        if (
            strpos($msg, 'Duplicate column') !== false ||
            strpos($msg, 'Duplicate entry') !== false ||
            strpos($msg, "already exists") !== false
        ) {
            echo "<li style='color:orange'>Skip (exists): $label</li>";
        } else {
            echo "<li style='color:red'>ERROR: $label — $msg</li>";
        }
    }
}

// 1. Add must_change_password to users
run($pdo, "Add must_change_password to users",
    "ALTER TABLE users ADD COLUMN must_change_password TINYINT(1) NOT NULL DEFAULT 0"
);

// 2. Rename manage_stock → manage_inventory
run($pdo, "Rename manage_stock → manage_inventory",
    "UPDATE permissions SET `key` = 'manage_inventory', label = 'Inventory Management',
     description = 'Manage fire extinguisher stock, register units, generate QR/labels'
     WHERE `key` = 'manage_stock'"
);

// 3. Rename approve_clients → manage_clients
run($pdo, "Rename approve_clients → manage_clients",
    "UPDATE permissions SET `key` = 'manage_clients', label = 'Clients Management',
     description = 'View, approve and manage client accounts'
     WHERE `key` = 'approve_clients'"
);

// 4. Delete unused permissions (cascade clears user_permissions)
run($pdo, "Remove manage_admins permission",
    "DELETE FROM permissions WHERE `key` = 'manage_admins'"
);
run($pdo, "Remove view_analytics permission",
    "DELETE FROM permissions WHERE `key` = 'view_analytics'"
);

// 5. Add new sidebar-mapped permissions
$newPerms = [
    ['manage_locations',    'Location Management',  'Manage client locations and site details'],
    ['manage_refills',      'Refills Management',   'View and process extinguisher refill requests'],
    ['manage_notifications','Notifications',         'Access and manage system notifications'],
    ['manage_settings',     'Settings',              'Access admin account settings'],
    ['manage_ai_assistant', 'AI Assistant',          'Access the FEMS AI assistant'],
];

$stmt = $pdo->prepare(
    "INSERT IGNORE INTO permissions (`key`, label, description) VALUES (?, ?, ?)"
);
foreach ($newPerms as [$key, $label, $desc]) {
    try {
        $stmt->execute([$key, $label, $desc]);
        echo "<li style='color:green'>OK: Insert permission $key</li>";
    } catch (PDOException $e) {
        echo "<li style='color:orange'>Skip: $key — " . $e->getMessage() . "</li>";
    }
}

echo "</ul><p><strong>Done.</strong></p>";
echo "<p>Current permissions:</p><ul>";
foreach ($pdo->query("SELECT `key`, label FROM permissions ORDER BY id") as $row) {
    echo "<li><code>{$row['key']}</code> — {$row['label']}</li>";
}
echo "</ul>";
