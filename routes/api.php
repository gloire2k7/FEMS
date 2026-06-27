<?php

$router = new Router();

$router->get('/api/test', function () {
    echo json_encode(["message" => "FEMS API is running successfully."]);
});

// Auth
$router->post('/api/login', ['AuthController', 'login']);
$router->post('/api/logout', ['AuthController', 'logout']);
$router->post('/api/forgot-password', ['AuthController', 'forgotPassword']);
$router->post('/api/reset-password', ['AuthController', 'resetPassword']);
$router->post('/api/register', ['AuthController', 'registerClient']);
$router->post('/api/register/verify', ['AuthController', 'verifyRegistrationOtp']);
$router->post('/api/register/resend', ['AuthController', 'resendRegistrationOtp']);
$router->get('/api/me', ['AuthController', 'me']);

// Dashboard analytics
$router->get('/api/dashboard/stats', ['DashboardController', 'stats']);

// Users & permissions
$router->get('/api/users', ['UserController', 'index']);
$router->get('/api/users/admins', ['UserController', 'admins']);
$router->get('/api/users/inspectors', ['UserController', 'inspectors']);
$router->get('/api/users/clients', ['UserController', 'clients']);
$router->get('/api/users/pending-clients', ['UserController', 'pendingClients']);
$router->get('/api/permissions', ['UserController', 'permissions']);
$router->get('/api/roles', ['UserController', 'roles']);
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

// Locations (client portal only)
$router->get('/api/locations', ['LocationController', 'index']);
$router->post('/api/locations', ['LocationController', 'store']);
$router->get('/api/locations/{id}/available-units', ['LocationController', 'availableUnits']);
$router->get('/api/locations/{id}', ['LocationController', 'show']);
$router->delete('/api/locations/{id}', ['LocationController', 'destroy']);
$router->post('/api/locations/{id}/units', ['LocationController', 'addUnits']);
$router->delete('/api/locations/{id}/units', ['LocationController', 'removeUnits']);

// Extinguishers / stock
$router->get('/api/extinguishers/stock', ['ExtinguisherController', 'stockSummary']);
$router->get('/api/extinguishers', ['ExtinguisherController', 'index']);
$router->post('/api/extinguishers', ['ExtinguisherController', 'store']);
$router->post('/api/extinguishers/bulk', ['ExtinguisherController', 'bulkStore']);
$router->put('/api/extinguishers/{id}/location', ['ExtinguisherController', 'assignLocation']);
$router->get('/api/extinguishers/{id}', ['ExtinguisherController', 'show']);
$router->put('/api/extinguishers/{id}', ['ExtinguisherController', 'update']);
$router->delete('/api/extinguishers/{id}', ['ExtinguisherController', 'destroy']);

// Product pricing
$router->get('/api/product-prices', ['ProductPriceController', 'index']);
$router->get('/api/product-prices/lookup', ['ProductPriceController', 'lookup']);
$router->put('/api/product-prices', ['ProductPriceController', 'update']);

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

// Service requests
$router->get('/api/service-requests/refills', ['ServiceRequestController', 'refills']);
$router->get('/api/service-requests/pending-inspections', ['ServiceRequestController', 'pendingInspections']);
$router->get('/api/service-requests/assigned-inspections', ['ServiceRequestController', 'assignedInspections']);
$router->get('/api/service-requests', ['ServiceRequestController', 'index']);
$router->post('/api/service-requests', ['ServiceRequestController', 'store']);
$router->put('/api/service-requests/{id}/confirm-done', ['ServiceRequestController', 'confirmDone']);
$router->put('/api/service-requests/{id}/schedule', ['ServiceRequestController', 'schedule']);
$router->put('/api/service-requests/{id}/mark-done', ['ServiceRequestController', 'markDone']);
$router->put('/api/service-requests/{id}/assign-inspection', ['ServiceRequestController', 'assignInspection']);
$router->get('/api/service-fees', ['ServiceRequestController', 'getFees']);
$router->put('/api/service-fees', ['ServiceRequestController', 'updateFees']);

// Mandatory inspections
$router->get('/api/mandatory-inspections/types', ['MandatoryInspectionController', 'indexTypes']);
$router->post('/api/mandatory-inspections/types', ['MandatoryInspectionController', 'storeType']);
$router->put('/api/mandatory-inspections/types/{id}', ['MandatoryInspectionController', 'updateType']);
$router->delete('/api/mandatory-inspections/types/{id}', ['MandatoryInspectionController', 'destroyType']);
$router->get('/api/mandatory-inspections/assignments', ['MandatoryInspectionController', 'indexAssignments']);
$router->post('/api/mandatory-inspections/assignments', ['MandatoryInspectionController', 'storeAssignment']);
$router->delete('/api/mandatory-inspections/assignments/{id}', ['MandatoryInspectionController', 'destroyAssignment']);
$router->get('/api/mandatory-inspections/mine', ['MandatoryInspectionController', 'inspectorIndex']);
$router->put('/api/mandatory-inspections/{id}/complete', ['MandatoryInspectionController', 'inspectorComplete']);

// Services (legacy extinguisher status endpoints)
$router->post('/api/extinguishers/{id}/refill-request', ['ServiceController', 'requestRefill']);
$router->post('/api/extinguishers/{id}/maintenance-request', ['ServiceController', 'requestMaintenance']);
$router->put('/api/extinguishers/{id}/confirm-service', ['ServiceController', 'confirmRequest']);
$router->put('/api/extinguishers/{id}/complete-service', ['ServiceController', 'completeService']);

// Inspection assignments
$router->get('/api/inspection-assignments/stats', ['InspectionAssignmentController', 'stats']);
$router->get('/api/inspection-assignments', ['InspectionAssignmentController', 'index']);
$router->post('/api/inspection-assignments', ['InspectionAssignmentController', 'store']);
$router->put('/api/inspection-assignments/{id}/claim', ['InspectionAssignmentController', 'claim']);
$router->put('/api/inspection-assignments/{id}/complete', ['InspectionAssignmentController', 'complete']);

// Reports
$router->get('/api/reports', ['ReportController', 'index']);
$router->post('/api/reports', ['ReportController', 'generate']);
$router->get('/api/reports/export-zip', ['ReportController', 'exportZip']);

$router->get('/api/compliance/alerts', ['ComplianceController', 'index']);

// Activity logs (Super Admin)
$router->get('/api/activity-logs', ['AuditLogController', 'index']);
$router->get('/api/activity-logs/export', ['AuditLogController', 'export']);

// Notifications
$router->get('/api/notifications', ['NotificationController', 'index']);
$router->get('/api/notifications/unread-count', ['NotificationController', 'unreadCount']);
$router->put('/api/notifications/{id}/read', ['NotificationController', 'markRead']);
$router->put('/api/notifications/read-all', ['NotificationController', 'markAllRead']);

// AI assistant
$router->post('/api/ai/chat', ['AiController', 'chat']);

$method = $_SERVER['REQUEST_METHOD'];
$uri = $_SERVER['REQUEST_URI'];
$router->dispatch($method, $uri);
