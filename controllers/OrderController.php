<?php

require_once __DIR__ . '/../helpers/mail_helper.php';

class OrderController extends Controller
{
    private $orderModel;
    private $extModel;

    public function __construct()
    {
        $this->orderModel = new Order();
        $this->extModel = new Extinguisher();
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
        $required = ['type', 'capacity', 'quantity', 'unit_price', 'delivery_address', 'payment_method'];
        foreach ($required as $field) {
            if (!isset($data[$field]) || (is_string($data[$field]) && trim($data[$field]) === '')) {
                $this->jsonResponse(["message" => "Missing field: $field"], 400);
            }
        }

        $quantity = (int) $data['quantity'];
        $available = $this->extModel->findAvailableInStock($data['type'], $data['capacity'], 9999);
        if (count($available) < $quantity) {
            $this->jsonResponse([
                'message' => "Insufficient stock. Requested: {$quantity}, Available: " . count($available),
            ], 409);
        }

        $orderData = [
            'client_id' => $clientId,
            'type' => $data['type'],
            'capacity' => $data['capacity'],
            'quantity' => $quantity,
            'unit_price' => $data['unit_price'],
            'total_price' => $data['unit_price'] * $quantity,
            'delivery_address' => $data['delivery_address'],
            'payment_method' => $data['payment_method'],
            'notes' => $data['notes'] ?? null,
        ];

        $orderId = $this->orderModel->create($orderData);
        if ($orderId) {
            $this->jsonResponse(['message' => 'Order placed successfully', 'order_id' => $orderId], 201);
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

        $units = $this->extModel->findAvailableInStock($order['type'], $order['capacity'], $order['quantity']);
        if (count($units) < (int) $order['quantity']) {
            $this->jsonResponse(['message' => 'Insufficient stock to approve.'], 409);
        }

        shuffle($units);
        $selected = array_slice($units, 0, (int) $order['quantity']);
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

        $this->orderModel->updateStatus($id, 'granted');
        MailHelper::sendOrderStatusUpdate($order['client_email'], $id, 'granted');
        $zipUrl = $this->createLabelZip($id, $pdfFiles);

        $this->jsonResponse([
            'message' => 'Order approved.',
            'units_assigned' => array_column($selected, 'serial_number'),
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
            $reason = $data['reason'] ?? 'No reason provided';
            $this->orderModel->updateStatus($id, 'cancelled', ['denial_reason' => $reason]);
            MailHelper::sendOrderStatusUpdate($order['client_email'], $id, 'cancelled', $reason);
            $this->jsonResponse(['message' => 'Order denied.']);
        }
        $this->jsonResponse(["message" => "Unknown action"], 400);
    }

    public function deliver($id)
    {
        AuthMiddleware::hasRoleOrPermission(['Super Admin'], 'manage_orders');
        $order = $this->orderModel->findById($id);
        if (!$order || $order['status'] !== 'granted') {
            $this->jsonResponse(["message" => "Order must be in granted status"], 400);
        }
        $this->orderModel->updateStatus($id, 'delivered');
        MailHelper::sendOrderStatusUpdate($order['client_email'], $id, 'delivered');
        $this->jsonResponse(['message' => 'Order marked as delivered.']);
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
