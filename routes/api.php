<?php

$router = new Router();

// Test Route
$router->get('/api/test', function () {
    echo json_encode(["message" => "FEMS API is running successfully."]);
});

// Auth Routes (Public)
$router->post('/api/login', ['AuthController', 'login']);

// Users
$router->get('/api/users', ['UserController', 'index']);
$router->post('/api/users', ['UserController', 'store']); // Public for Company User, Auth for Admin
$router->get('/api/users/{id}', ['UserController', 'show']);
$router->put('/api/users/{id}', ['UserController', 'update']);
$router->delete('/api/users/{id}', ['UserController', 'destroy']);
$router->post('/api/users/change-password', ['UserController', 'changePassword']);

// Clients
$router->get('/api/clients', ['ClientController', 'index']);
$router->post('/api/clients', ['ClientController', 'store']);
$router->get('/api/clients/{id}', ['ClientController', 'show']);
$router->put('/api/clients/{id}', ['ClientController', 'update']);
$router->delete('/api/clients/{id}', ['ClientController', 'destroy']);

// Extinguishers
$router->get('/api/extinguishers', ['ExtinguisherController', 'index']);
$router->post('/api/extinguishers', ['ExtinguisherController', 'store']);
$router->post('/api/extinguishers/bulk', ['ExtinguisherController', 'bulkStore']);
$router->get('/api/extinguishers/{id}', ['ExtinguisherController', 'show']);
$router->put('/api/extinguishers/{id}', ['ExtinguisherController', 'update']);
$router->delete('/api/extinguishers/{id}', ['ExtinguisherController', 'destroy']);

// Orders
$router->get('/api/orders', ['OrderController', 'index']);
$router->post('/api/orders', ['OrderController', 'store']);
$router->get('/api/orders/{id}', ['OrderController', 'show']);
$router->put('/api/orders/{id}/grant', ['OrderController', 'grant']);
$router->put('/api/orders/{id}/confirm', ['OrderController', 'confirm']);

// Shop Products (grouped stock for clients)
$router->get('/api/shop/products', function () {
    try {
        $db = Database::getConnection();
        $query = "
            SELECT type, capacity, CAST(price AS UNSIGNED) as price,
                   COUNT(*) as total_in_stock
            FROM fire_extinguishers
            WHERE client_id IS NULL AND status = 'filled'
            GROUP BY type, capacity, price
            ORDER BY type, capacity
        ";
        $stmt = $db->prepare($query);
        $stmt->execute();
        $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Ensure numbers are numbers
        $products = array_map(function($p) {
            $p['price'] = (int)$p['price'];
            $p['total_in_stock'] = (int)$p['total_in_stock'];
            return $p;
        }, $products);

        header('Content-Type: application/json');
        echo json_encode($products);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["message" => "Internal Server Error", "error" => $e->getMessage()]);
    }
    exit;
});

// Services (Refill & Maintenance)
$router->post('/api/extinguishers/{id}/refill-request', ['ServiceController', 'requestRefill']);
$router->post('/api/extinguishers/{id}/maintenance-request', ['ServiceController', 'requestMaintenance']);
$router->put('/api/extinguishers/{id}/confirm-service', ['ServiceController', 'confirmRequest']);
$router->put('/api/extinguishers/{id}/complete-service', ['ServiceController', 'completeService']);

// Reports
$router->get('/api/reports', ['ReportController', 'index']);
$router->post('/api/reports', ['ReportController', 'generate']);
$router->get('/api/reports/export-zip', ['ReportController', 'exportZip']);

$method = $_SERVER['REQUEST_METHOD'];
$uri = $_SERVER['REQUEST_URI'];
$router->dispatch($method, $uri);
