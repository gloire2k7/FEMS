<?php
$host = '127.0.0.1';
$db   = 'fems_db';
$user = 'root';
$pass = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $queries = [
        'ALTER TABLE fire_extinguishers ADD COLUMN price DECIMAL(10,2) DEFAULT 0.00',
        'ALTER TABLE orders ADD COLUMN unit_price DECIMAL(10,2) DEFAULT 0.00',
        'ALTER TABLE orders ADD COLUMN total_price DECIMAL(10,2) DEFAULT 0.00'
    ];

    echo "<h1>Database Migration</h1>";
    echo "<ul>";

    foreach ($queries as $q) {
        try {
            $pdo->exec($q);
            echo "<li style='color:green;'>Success: $q</li>";
        } catch (PDOException $e) {
            if ($e->getCode() == '42S21' || strpos($e->getMessage(), 'Duplicate column name') !== false) {
                echo "<li style='color:orange;'>Already exists: $q</li>";
            } else {
                echo "<li style='color:red;'>Error updating: " . $e->getMessage() . "</li>";
            }
        }
    }

    echo "</ul><br>";
    echo "<h2>Done! You can now close this tab and go register your fire extinguishers!</h2>";

} catch (\PDOException $e) {
    echo "Connection failed: " . $e->getMessage();
}
