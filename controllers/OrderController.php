<?php

require_once __DIR__ . '/../helpers/mail_helper.php';

class OrderController extends Controller
{
    private $orderModel;
    private $extModel;
    private $priceModel;

    public function __construct()
    {
        $this->orderModel = new Order();
        $this->extModel = new Extinguisher();
        $this->priceModel = new ProductPrice();
    }

    public function index()
    {
        AuthMiddleware::check();
        $roleName = $_SESSION['role_name'] ?? '';
        $companyId = $_SESSION['company_id'] ?? null;
        $page = max(1, (int) ($_GET['page'] ?? 1));
        $limit = min(50, max(5, (int) ($_GET['limit'] ?? 10)));

        if (in_array($roleName, ['Super Admin', 'Admin'], true)) {
            if ($roleName === 'Admin') {
                AuthMiddleware::hasPermission('manage_orders');
            }
            $this->jsonResponse($this->orderModel->findPaginated($page, $limit));
        }

        if (!$companyId) {
            $this->jsonResponse(["message" => "No client linked to this account."], 400);
        }
        $this->jsonResponse($this->orderModel->findPaginated($page, $limit, $companyId));
    }

    public function show($id)
    {
        AuthMiddleware::check();
        $order = $this->orderModel->findById($id);
        if (!$order) {
            $this->jsonResponse(["message" => "Order not found"], 404);
        }

        $role = $_SESSION['role_name'] ?? '';
        if ($role === 'Company User' && (int) $order['client_id'] !== (int) ($_SESSION['company_id'] ?? 0)) {
            $this->jsonResponse(["message" => "Forbidden"], 403);
        }

        $available = $this->extModel->findAvailableInStock($order['type'], $order['capacity'], 9999);
        $stockCount = count($available);
        $qty = (int) $order['quantity'];

        $order['stock_available'] = $stockCount;
        $order['can_grant_full'] = $stockCount >= $qty;
        $order['max_grantable'] = min($stockCount, $qty);
        $order['stock_shortfall'] = max(0, $qty - $stockCount);

        if ($role !== 'Company User') {
            $order['assigned_units'] = $this->getAssignedUnits($id);
        }

        $this->jsonResponse($order);
    }

    public function store()
    {
        AuthMiddleware::check();
        $clientId = $_SESSION['company_id'] ?? null;
        if (!$clientId) {
            $this->jsonResponse(["message" => "Your account is not linked to a company."], 400);
        }

        $data = $this->getJsonInput();
        $required = ['type', 'capacity', 'quantity', 'delivery_address', 'payment_method'];
        foreach ($required as $field) {
            if (!isset($data[$field]) || (is_string($data[$field]) && trim($data[$field]) === '')) {
                $this->jsonResponse(["message" => "Missing field: $field"], 400);
            }
        }

        if (!$this->priceModel->validateType($data['type'])) {
            $this->jsonResponse(['message' => 'Invalid extinguisher type'], 400);
        }
        if (!$this->priceModel->validateCapacity($data['capacity'])) {
            $this->jsonResponse(['message' => 'Capacity must be 6, 9, or 12 kg'], 400);
        }

        $quantity = max(1, (int) $data['quantity']);
        $capacity = $this->priceModel->normalizeCapacity($data['capacity']);
        $unitPrice = $this->priceModel->getPrice($data['type'], $capacity);

        if ($unitPrice === null) {
            $this->jsonResponse(['message' => 'Price not configured for this product. Contact administrator.'], 400);
        }

        $orderData = [
            'client_id' => $clientId,
            'type' => $data['type'],
            'capacity' => $capacity,
            'quantity' => $quantity,
            'unit_price' => $unitPrice,
            'total_price' => $unitPrice * $quantity,
            'delivery_address' => trim($data['delivery_address']),
            'payment_method' => trim($data['payment_method']),
            'notes' => $data['notes'] ?? null,
        ];

        $orderId = $this->orderModel->create($orderData);
        if ($orderId) {
            $this->jsonResponse([
                'message' => 'Order submitted successfully. Awaiting admin review.',
                'order_id' => $orderId,
                'unit_price' => $unitPrice,
                'total_price' => $unitPrice * $quantity,
            ], 201);
        }
        $this->jsonResponse(["message" => "Failed to place order"], 500);
    }

    public function grant($id)
    {
        AuthMiddleware::hasRoleOrPermission(['Super Admin'], 'manage_orders');

        $order = $this->orderModel->findById($id);
        if (!$order || $order['status'] !== 'pending') {
            $this->jsonResponse(["message" => "Order not found or not pending"], 400);
        }

        $data = $this->getJsonInput();
        $grantQty = isset($data['quantity']) ? (int) $data['quantity'] : (int) $order['quantity'];
        $deliveryDate = $data['expected_delivery_date'] ?? null;

        if (!$deliveryDate) {
            $this->jsonResponse(['message' => 'Expected delivery date is required'], 400);
        }
        if ($grantQty < 1 || $grantQty > (int) $order['quantity']) {
            $this->jsonResponse(['message' => 'Invalid grant quantity'], 400);
        }

        $units = $this->extModel->findAvailableInStock($order['type'], $order['capacity'], $grantQty);
        $available = count($units);

        if ($available < $grantQty) {
            $this->jsonResponse([
                'message' => "Insufficient stock. Requested: {$grantQty}, Available: {$available}",
                'stock_available' => $available,
            ], 409);
        }

        shuffle($units);
        $selected = array_slice($units, 0, $grantQty);
        require_once __DIR__ . '/../helpers/pdf_helper.php';

        $pdfFiles = [];
        foreach ($selected as $unit) {
            $this->extModel->allocateToOrder($unit['id'], $order['client_id'], $id);
            $this->extModel->logMovement($unit['id'], 'allocated', $_SESSION['user_id'], "Order #$id");

            $labelData = [
                'serial_number' => $unit['serial_number'],
                'type' => $unit['type'],
                'capacity' => $unit['capacity'],
                'client_name' => $order['client_name'] ?? 'Client',
                'filling_date' => $unit['filling_date'] ?? date('Y-m-d'),
                'expiry_date' => $unit['expiry_date'] ?? 'N/A',
            ];
            $pdfPath = PDFHelper::generateLabel($unit['id'], $labelData);
            $ext = $this->extModel->findById($unit['id']);
            $ext['label_pdf_path'] = $pdfPath;
            $this->extModel->update($unit['id'], $ext);
            $pdfFiles[] = __DIR__ . '/..' . $pdfPath;
        }

        $this->orderModel->updateStatus($id, 'granted', [
            'granted_quantity' => $grantQty,
            'expected_delivery_date' => $deliveryDate,
        ]);

        $remainderOrderId = null;
        $remainderQty = (int) $order['quantity'] - $grantQty;

        if ($remainderQty > 0) {
            $remainderOrderId = $this->orderModel->create([
                'client_id' => $order['client_id'],
                'type' => $order['type'],
                'capacity' => $order['capacity'],
                'quantity' => $remainderQty,
                'unit_price' => $order['unit_price'],
                'total_price' => $order['unit_price'] * $remainderQty,
                'delivery_address' => $order['delivery_address'],
                'payment_method' => $order['payment_method'],
                'notes' => 'Remainder from order #' . $id,
                'parent_order_id' => $id,
            ]);
        }

        MailHelper::sendOrderStatusUpdate(
            $order['client_email'],
            $id,
            $remainderQty > 0 ? 'partially_granted' : 'granted',
            null,
            $deliveryDate,
            $grantQty,
            (int) $order['quantity']
        );

        $zipUrl = $this->createLabelZip($id, $pdfFiles);

        $this->jsonResponse([
            'message' => $remainderQty > 0
                ? "Partially granted {$grantQty} of {$order['quantity']} units. Remainder order #{$remainderOrderId} created."
                : 'Order fully granted.',
            'units_assigned' => array_column($selected, 'serial_number'),
            'granted_quantity' => $grantQty,
            'remainder_order_id' => $remainderOrderId,
            'labels_zip' => $zipUrl,
        ]);
    }

    public function confirm($id)
    {
        AuthMiddleware::hasRoleOrPermission(['Super Admin'], 'manage_orders');
        $order = $this->orderModel->findById($id);
        if (!$order) {
            $this->jsonResponse(["message" => "Order not found"], 404);
        }

        $data = $this->getJsonInput();
        if (($data['action'] ?? '') === 'deny') {
            if ($order['status'] !== 'pending') {
                $this->jsonResponse(['message' => 'Only pending orders can be denied'], 400);
            }
            $reason = trim($data['reason'] ?? '') ?: 'No reason provided';
            $this->orderModel->updateStatus($id, 'cancelled', ['denial_reason' => $reason]);
            MailHelper::sendOrderStatusUpdate($order['client_email'], $id, 'cancelled', $reason);
            $this->jsonResponse(['message' => 'Order denied.']);
        }
        $this->jsonResponse(["message" => "Unknown action"], 400);
    }

    public function deliver($id)
    {
        AuthMiddleware::check();
        $order = $this->orderModel->findById($id);
        if (!$order) {
            $this->jsonResponse(["message" => "Order not found"], 404);
        }

        $role = $_SESSION['role_name'] ?? '';

        if ($role === 'Company User') {
            if ((int) $order['client_id'] !== (int) ($_SESSION['company_id'] ?? 0)) {
                $this->jsonResponse(["message" => "Forbidden"], 403);
            }
            if ($order['status'] !== 'granted') {
                $this->jsonResponse(["message" => "Order must be approved before confirming delivery"], 400);
            }
            $this->orderModel->updateStatus($id, 'delivered', ['client_confirmed' => true]);
            MailHelper::sendOrderStatusUpdate($order['client_email'], $id, 'delivered');
            $this->jsonResponse(['message' => 'Delivery confirmed. Thank you!']);
        }

        AuthMiddleware::hasRoleOrPermission(['Super Admin'], 'manage_orders');
        if ($order['status'] !== 'granted') {
            $this->jsonResponse(["message" => "Order must be in granted status"], 400);
        }
        $this->orderModel->updateStatus($id, 'delivered');
        MailHelper::sendOrderStatusUpdate($order['client_email'], $id, 'delivered');
        $this->jsonResponse(['message' => 'Order marked as delivered.']);
    }

    private function getAssignedUnits($orderId)
    {
        $db = Database::getConnection();
        $stmt = $db->prepare(
            "SELECT id, serial_number, type, capacity, status FROM fire_extinguishers WHERE order_id = ?"
        );
        $stmt->execute([$orderId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    private function createLabelZip($orderId, array $pdfFiles)
    {
        $zipDir = __DIR__ . '/../uploads/order_zips/';
        if (!is_dir($zipDir)) {
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
