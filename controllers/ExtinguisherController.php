<?php

class ExtinguisherController extends Controller
{
    private $extModel;

    public function __construct()
    {
        $this->extModel = new Extinguisher();
    }

    public function index()
    {
        AuthMiddleware::check();
        $page  = max(1, (int) ($_GET['page'] ?? 1));
        $limit = min(50, max(1, (int) ($_GET['limit'] ?? 5)));
        $statusMap = ['in_stock' => true, 'allocated' => true, 'all' => true];
        $status = isset($statusMap[$_GET['status'] ?? '']) ? $_GET['status'] : 'in_stock';
        $sort   = ($_GET['sort'] ?? 'newest') === 'oldest' ? 'oldest' : 'newest';
        $this->jsonResponse($this->extModel->findPaginated($page, $limit, $status, $sort));
    }

    public function stockSummary()
    {
        AuthMiddleware::hasRoleOrPermission(['Super Admin'], 'manage_inventory');
        $recentPage = max(1, (int) ($_GET['recent_page'] ?? 1));
        $this->jsonResponse([
            'summary' => $this->extModel->getStockSummary(),
            'recent'  => $this->extModel->getRecentMovementsPaginated($recentPage, 3),
        ]);
    }

    public function store()
    {
        AuthMiddleware::hasRoleOrPermission(['Super Admin'], 'manage_inventory');
        return $this->createSingle($this->getJsonInput());
    }

    public function bulkStore()
    {
        AuthMiddleware::hasRoleOrPermission(['Super Admin'], 'manage_inventory');
        $data = $this->getJsonInput();

        if (!isset($data['count']) || !is_numeric($data['count'])) {
            $this->jsonResponse(["message" => "Count is required"], 400);
        }
        $count = (int) $data['count'];
        if ($count < 1 || $count > 100) {
            $this->jsonResponse(["message" => "Count must be between 1 and 100"], 400);
        }

        $results = [];
        for ($i = 0; $i < $count; $i++) {
            $results[] = $this->createSingle($data, true);
        }
        $this->jsonResponse(['message' => "Registered $count units", 'results' => $results], 201);
    }

    private function createSingle($data, $isBulk = false)
    {
        require_once __DIR__ . '/../helpers/qr_helper.php';

        if (!$this->validateRequiredParams(['type', 'capacity', 'price'], $data)) {
            if ($isBulk) return ['error' => 'Missing fields'];
            $this->jsonResponse(["message" => "Type, capacity and price required"], 400);
        }

        $data['client_id'] = null;
        $data['serial_number'] = 'FEMS-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -5));
        $data['qr_code_path'] = '/uploads/qrcodes/' . $data['serial_number'] . '.png';
        $data['label_pdf_path'] = null;

        $id = $this->extModel->create($data);
        if (!$id) {
            if ($isBulk) return ['error' => 'Creation failed'];
            $this->jsonResponse(["message" => "Failed to create"], 500);
        }

        $qrPath = QRHelper::generate($id, $data['serial_number']);
        $ext = $this->extModel->findById($id);
        $ext['qr_code_path'] = $qrPath;
        $this->extModel->update($id, $ext);
        $this->extModel->logMovement($id, 'registered', $_SESSION['user_id'], $data['serial_number']);

        $result = ['id' => $id, 'serial_number' => $data['serial_number'], 'qr_path' => $qrPath];
        if ($isBulk) return $result;
        $this->jsonResponse(array_merge(['message' => 'Unit registered'], $result), 201);
    }

    public function update($id)
    {
        AuthMiddleware::hasRoleOrPermission(['Super Admin'], 'manage_inventory');
        $data = $this->getJsonInput();
        $ext = $this->extModel->findById($id);
        if (!$ext) {
            $this->jsonResponse(["message" => "Not found"], 404);
        }
        if ($this->extModel->update($id, array_merge($ext, $data))) {
            $this->jsonResponse(['message' => 'Updated']);
        }
        $this->jsonResponse(["message" => "Update failed"], 500);
    }

    public function destroy($id)
    {
        AuthMiddleware::hasRole(['Super Admin']);
        $ext = $this->extModel->findById($id);
        if (!$ext) {
            $this->jsonResponse(["message" => "Not found"], 404);
        }
        $this->extModel->logMovement($id, 'removed', $_SESSION['user_id'], $ext['serial_number']);
        if ($this->extModel->delete($id)) {
            $this->jsonResponse(['message' => 'Deleted']);
        }
        $this->jsonResponse(["message" => "Deletion failed"], 500);
    }

    public function show($id)
    {
        AuthMiddleware::check();
        $ext = is_numeric($id)
            ? $this->extModel->findById($id)
            : $this->extModel->findBySerialNumber($id);
        if ($ext) {
            $this->jsonResponse($ext);
        }
        $this->jsonResponse(["message" => "Not found"], 404);
    }
}
