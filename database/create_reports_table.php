<?php
require_once 'config/database.php';

try {
    $db = Database::getConnection();
    
    $sql = "CREATE TABLE IF NOT EXISTS `generated_reports` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `name` VARCHAR(255) NOT NULL,
        `type` VARCHAR(100) NOT NULL,
        `file_path` VARCHAR(255) NOT NULL,
        `format` ENUM('csv', 'pdf') NOT NULL,
        `start_date` DATE NULL,
        `end_date` DATE NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )";

    $db->exec($sql);
    echo "Table `generated_reports` created successfully.\n";

} catch (PDOException $e) {
    die("Error creating table: " . $e->getMessage() . "\n");
}
