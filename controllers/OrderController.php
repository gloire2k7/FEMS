<?php

class OrderController extends Controller
{
    private $orderModel;
    private $extModel;

    public function __construct()
    {
        $this->orderModel = new Order();
        $this->extModel = new Extinguisher();
    }

    /**
     * GET /api/orders
     * Admin: list all orders. Client: list their own orders.
     */
    public function index()
    {
        $logFile = __DIR__ . '/../debug_orders.log';
        file_put_contents($logFile, "--- Index called at " . date('Y-m-d H:i:s') . " ---\n", FILE_APPEND);
        
        try {
            AuthMiddleware::check();
            file_put_contents($logFile, "Auth check passed. Session: " . print_r($_SESSION, true) . "\n", FILE_APPEND);
            
            // Use flat session keys if the nested 'user' array is missing
            $roleName = $_SESSION['user']['role_name'] ?? ($_SESSION['role_name'] ?? '');
            $companyId = $_SESSION['user']['company_id'] ?? ($_SESSION['company_id'] ?? null);

            file_put_contents($logFile, "Role: $roleName | Company ID: $companyId\n", FILE_APPEND);

            if (in_array($roleName, ['Super Admin', 'Admin'])) {
                $orders = $this->orderModel->findAll();
                file_put_contents($logFile, "Fetched all orders: " . count($orders) . " found.\n", FILE_APPEND);
            } else {
                if (!$companyId) {
                    file_put_contents($logFile, "No client linked. Returning 400.\n", FILE_APPEND);
                    $this->jsonResponse(["message" => "No client linked to this account session."], 400);
                }
                $orders = $this->orderModel->findByClient($companyId);
                file_put_contents($logFile, "Fetched client orders: " . count($orders) . " found.\n", FILE_APPEND);
            }
            file_put_contents($logFile, "Sending response.\n", FILE_APPEND);
            $this->jsonResponse($orders);
        } catch (Exception $e) {
            file_put_contents($logFile, "ERROR: " . $e->getMessage() . "\n", FILE_APPEND);
            $this->jsonResponse(["message" => "Error loading orders: " . $e->getMessage()], 500);
        }
    }

    /**
     * GET /api/orders/{id}
     */
    public function show($id)
    {
        AuthMiddleware::check();
        $order = $this->orderModel->findById($id);
        if ($order) {
            $this->jsonResponse($order);
        }
        $this->jsonResponse(["message" => "Order not found"], 404);
    }

    /**
     * POST /api/orders
     * Client places a new order.
     */
    public function store()
    {
        AuthMiddleware::check();
        
        // Use flat session keys if the nested 'user' array is missing
        $clientId = $_SESSION['user']['company_id'] ?? ($_SESSION['company_id'] ?? null);

        if (!$clientId) {
            $this->jsonResponse(["message" => "Order Failed: Your account is not properly linked to a company. Please logout and login again."], 400);
        }

        $data = $this->getJsonInput();

        $required = ['type', 'capacity', 'quantity', 'unit_price', 'delivery_address', 'payment_method'];
        foreach ($required as $field) {
            if (!isset($data[$field]) || (is_string($data[$field]) && trim($data[$field]) === '')) {
                $this->jsonResponse(["message" => "Order Failed: Missing or empty field: $field"], 400);
            }
        }

        $quantity = (int)$data['quantity'];

        // Check if enough units are in stock
        $available = $this->extModel->findAvailableInStock($data['type'], $data['capacity'], 9999);
        if (count($available) < $quantity) {
            $this->jsonResponse([
                "message" => "Insufficient stock. Requested: {$quantity}, Available: " . count($available)
            ], 409);
        }

        $orderData = [
            'client_id'      => $clientId,
            'type'           => $data['type'],
            'capacity'       => $data['capacity'],
            'quantity'       => $quantity,
            'unit_price'     => $data['unit_price'],
            'total_price'    => $data['unit_price'] * $quantity,
        ];

        $orderId = $this->orderModel->create($orderData);
        if ($orderId) {
            $this->jsonResponse([
                "message" => "Order placed successfully",
                "order_id" => $orderId
            ], 201);
        }
        $this->jsonResponse(["message" => "Failed to place order"], 500);
    }

    /**
     * PUT /api/orders/{id}/grant  -> Admin APPROVES order
     */
    public function grant($id)
    {
        AuthMiddleware::hasRole(['Super Admin', 'Admin']);

        $order = $this->orderModel->findById($id);
        if (!$order) {
            $this->jsonResponse(["message" => "Order not found"], 404);
        }
        if ($order['status'] !== 'pending') {
            $this->jsonResponse(["message" => "Order is not in pending state"], 400);
        }

        // Find available stock units
        $units = $this->extModel->findAvailableInStock($order['type'], $order['capacity'], $order['quantity']);
        if (count($units) < (int)$order['quantity']) {
            $this->jsonResponse([
                "message" => "Insufficient stock to approve. Available: " . count($units) . ", Needed: " . $order['quantity']
            ], 409);
        }

        // Randomly shuffle and pick the needed units
        shuffle($units);
        $selectedUnits = array_slice($units, 0, (int)$order['quantity']);

        require_once __DIR__ . '/../helpers/pdf_helper.php';

        $pdfFiles = [];
        $clientId = $order['client_id'];

        foreach ($selectedUnits as $unit) {
            // Assign unit to this client & order
            $this->extModel->allocateToOrder($unit['id'], $clientId, $id);

            // Generate inspection label PDF
            $labelData = [
                'serial_number' => $unit['serial_number'],
                'type'          => $unit['type'],
                'capacity'      => $unit['capacity'],
                'client_name'   => $order['client_name'] ?? 'Client',
                'filling_date'  => $unit['filling_date'] ?? date('Y-m-d'),
                'expiry_date'   => $unit['expiry_date'] ?? 'N/A',
            ];
            $pdfPath = PDFHelper::generateLabel($unit['id'], $labelData);
            // Save label path to extinguisher
            $ext = $this->extModel->findById($unit['id']);
            $ext['label_pdf_path'] = $pdfPath;
            $this->extModel->update($unit['id'], $ext);
            $pdfFiles[] = __DIR__ . '/..' . $pdfPath;
        }

        // Update order status
        $this->orderModel->updateStatus($id, 'granted');

        // Create ZIP of all labels
        $zipUrl = $this->createLabelZip($id, $pdfFiles);

        $this->jsonResponse([
            "message"       => "Order approved. " . count($selectedUnits) . " units assigned.",
            "units_assigned" => array_column($selectedUnits, 'serial_number'),
            "labels_zip"    => $zipUrl
        ]);
    }

    /**
     * PUT /api/orders/{id}/confirm -> Admin DENIES order
     */
    public function confirm($id)
    {
        AuthMiddleware::hasRole(['Super Admin', 'Admin']);

        $order = $this->orderModel->findById($id);
        if (!$order) {
            $this->jsonResponse(["message" => "Order not found"], 404);
        }

        $data = $this->getJsonInput();
        $action = $data['action'] ?? 'deny';

        if ($action === 'deny') {
            $this->orderModel->updateStatus($id, 'cancelled');
            $this->jsonResponse(["message" => "Order denied successfully."]);
        }

        $this->jsonResponse(["message" => "Unknown action"], 400);
    }

    /**
     * Create a ZIP file with all PDF labels for an order.
     */
    private function createLabelZip($orderId, array $pdfFiles)
    {
        $zipDir = __DIR__ . '/../uploads/order_zips/';
        if (!file_exists($zipDir)) {
            mkdir($zipDir, 0777, true);
        }

        $zipFilename = "order_{$orderId}_labels.zip";
        $zipPath = $zipDir . $zipFilename;

        $zip = new ZipArchive();
        if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) === true) {
            foreach ($pdfFiles as $file) {
                if (file_exists($file)) {
                    $zip->addFile($file, basename($file));
                }
            }
            $zip->close();
            return '/uploads/order_zips/' . $zipFilename;
        }

        return null;
    }
}
