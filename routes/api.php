<?php

$router = new Router();

$router->get('/api/test', function () {
    echo json_encode(["message" => "FEMS API is running successfully."]);
});

// Auth
$router->post('/api/login', ['AuthController', 'login']);
$router->post('/api/logout', ['AuthController', 'logout']);
$router->get('/api/me', ['AuthController', 'me']);

// Dashboard analytics
$router->get('/api/dashboard/stats', ['DashboardController', 'stats']);

// Users & permissions
$router->get('/api/users', ['UserController', 'index']);
$router->get('/api/users/admins', ['UserController', 'admins']);
$router->get('/api/users/clients', ['UserController', 'clients']);
$router->get('/api/users/pending-clients', ['UserController', 'pendingClients']);
$router->get('/api/permissions', ['UserController', 'permissions']);
$router->post('/api/users', ['UserController', 'store']);
$router->get('/api/users/{id}', ['UserController', 'show']);
$router->put('/api/users/{id}', ['UserController', 'update']);
$router->put('/api/users/{id}/status', ['UserController', 'setStatus']);
$router->put('/api/users/{id}/approve', ['UserController', 'approveClient']);
$router->put('/api/users/{id}/reject', ['UserController', 'rejectClient']);
$router->delete('/api/users/{id}', ['UserController', 'destroy']);
$router->post('/api/users/change-password', ['UserController', 'changePassword']);

// Clients
$router->get('/api/clients', ['ClientController', 'index']);
$router->post('/api/clients', ['ClientController', 'store']);
$router->get('/api/clients/{id}', ['ClientController', 'show']);
$router->put('/api/clients/{id}', ['ClientController', 'update']);
$router->delete('/api/clients/{id}', ['ClientController', 'destroy']);

// Extinguishers / stock
$router->get('/api/extinguishers/stock', ['ExtinguisherController', 'stockSummary']);
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
$router->put('/api/orders/{id}/deliver', ['OrderController', 'deliver']);

// Shop
$router->get('/api/shop/products', function () {
    try {
        $db = Database::getConnection();
        $stmt = $db->query("
            SELECT type, capacity, CAST(price AS UNSIGNED) as price, COUNT(*) as total_in_stock
            FROM fire_extinguishers
            WHERE client_id IS NULL AND status = 'filled'
            GROUP BY type, capacity, price ORDER BY type, capacity
        ");
        $products = array_map(function ($p) {
            $p['price'] = (int) $p['price'];
            $p['total_in_stock'] = (int) $p['total_in_stock'];
            return $p;
        }, $stmt->fetchAll(PDO::FETCH_ASSOC));
        header('Content-Type: application/json');
        echo json_encode($products);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["message" => "Error", "error" => $e->getMessage()]);
    }
    exit;
});

// Services
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
