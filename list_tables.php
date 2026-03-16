<?php
require_once 'config/database.php';
$db = Database::getConnection();
$stmt = $db->query("SHOW TABLES");
$tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
echo "Tables:\n";
foreach ($tables as $table) {
    echo "- $table\n";
}
