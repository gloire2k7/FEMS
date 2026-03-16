-- Create tables for FEMS Backend
-- Note: Must be run on MySQL or MariaDB

CREATE TABLE `roles` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(50) NOT NULL
);

INSERT INTO `roles` (`name`) VALUES ('Super Admin'), ('Admin'), ('Company User');

CREATE TABLE `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `role_id` INT,
    `company_id` INT NULL,
    `status` ENUM('active', 'inactive') DEFAULT 'active',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`)
);

CREATE TABLE `clients` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `company_name` VARCHAR(150) NOT NULL,
    `contact_person` VARCHAR(100),
    `phone` VARCHAR(50),
    `email` VARCHAR(100),
    `address` TEXT,
    `gps_lat` DECIMAL(10, 8),
    `gps_lng` DECIMAL(11, 8),
    `delivery_instructions` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `locations` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `client_id` INT NOT NULL,
    `location_name` VARCHAR(150) NOT NULL,
    `address` TEXT,
    `gps_lat` DECIMAL(10, 8),
    `gps_lng` DECIMAL(11, 8),
    FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE CASCADE
);

CREATE TABLE `fire_extinguishers` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `serial_number` VARCHAR(100) NOT NULL UNIQUE,
    `qr_code_path` VARCHAR(255),
    `type` VARCHAR(50) NOT NULL,
    `capacity` VARCHAR(50) NOT NULL,
    `status` ENUM('filled', 'unfilled', 'under_maintenance', 'condemned', 'expired', 'requires_refill', 'requires_maintenance') DEFAULT 'filled',
    `manufacturing_date` DATE,
    `filling_date` DATE,
    `expiry_date` DATE,
    `pressure_status` VARCHAR(50),
    `cylinder_condition` VARCHAR(50),
    `client_id` INT NULL,
    `location_id` INT,
    `order_id` INT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE SET NULL
);

CREATE TABLE `orders` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `client_id` INT NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `capacity` VARCHAR(50) NOT NULL,
    `quantity` INT NOT NULL,
    `status` ENUM('pending', 'granted', 'delivered', 'cancelled') DEFAULT 'pending',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE CASCADE
);

ALTER TABLE fire_extinguishers ADD FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE SET NULL;

CREATE INDEX idx_serial ON fire_extinguishers (serial_number);
CREATE INDEX idx_expiry ON fire_extinguishers (expiry_date);
CREATE INDEX idx_client ON fire_extinguishers (client_id);

CREATE TABLE `inspections` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `extinguisher_id` INT NOT NULL,
    `inspector_id` INT NOT NULL,
    `pressure_level` VARCHAR(50),
    `weight` DECIMAL(10,2),
    `physical_condition` VARCHAR(255),
    `seal_status` VARCHAR(50),
    `hose_condition` VARCHAR(50),
    `bracket_condition` VARCHAR(50),
    `result_status` ENUM('passed', 'requires_refill', 'expired', 'condemned') NOT NULL,
    `inspection_date` DATE NOT NULL,
    `next_due_date` DATE NOT NULL,
    `notes` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`extinguisher_id`) REFERENCES `fire_extinguishers`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`inspector_id`) REFERENCES `users`(`id`)
);

CREATE TABLE `maintenance_records` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `extinguisher_id` INT NOT NULL,
    `service_type` VARCHAR(100) NOT NULL,
    `description` TEXT,
    `service_date` DATE NOT NULL,
    `performed_by` INT NOT NULL,
    FOREIGN KEY (`extinguisher_id`) REFERENCES `fire_extinguishers`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`performed_by`) REFERENCES `users`(`id`)
);

CREATE TABLE `extinguisher_movements` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `extinguisher_id` INT NOT NULL,
    `from_location` VARCHAR(255),
    `to_location` VARCHAR(255),
    `moved_by` INT NOT NULL,
    `movement_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`extinguisher_id`) REFERENCES `fire_extinguishers`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`moved_by`) REFERENCES `users`(`id`)
);

CREATE TABLE `notifications` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `message` TEXT NOT NULL,
    `is_read` BOOLEAN DEFAULT FALSE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

CREATE TABLE `audit_logs` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `action` VARCHAR(100) NOT NULL,
    `table_name` VARCHAR(100) NOT NULL,
    `record_id` INT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
);
