<?php
spl_autoload_register(function ($class_name) {
    $directories = ['Core/', 'models/', 'controllers/', 'middleware/'];
    foreach ($directories as $directory) {
        $file = __DIR__ . '/' . $directory . $class_name . '.php';
        if (file_exists($file)) {
            require_once $file;
            return;
        }
    }
});

require_once 'config/database.php';
$db = Database::getConnection();

echo "--- ROLES ---\n";
$stmt = $db->query("SELECT * FROM roles");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "ID: " . $row['id'] . " | Name: " . $row['name'] . "\n";
}

echo "\n--- ORDERS SCHEMA ---\n";
$stmt = $db->query("DESCRIBE orders");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo $row['Field'] . " | " . $row['Type'] . " | " . $row['Null'] . " | " . $row['Key'] . " | " . $row['Default'] . " | " . $row['Extra'] . "\n";
}
