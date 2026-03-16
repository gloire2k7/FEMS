<?php
require_once 'config/database.php';
try {
    $db = Database::getConnection();
    echo "Connected successfully to " . print_r($db, true) . "\n";
    $stmt = $db->query("SHOW TABLES");
    $tables = $stmt->fetchAll();
    echo "Tables count: " . count($tables) . "\n";
    foreach ($tables as $table) {
        print_r($table);
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
