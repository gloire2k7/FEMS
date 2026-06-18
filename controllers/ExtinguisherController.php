<?php

require_once __DIR__ . '/../helpers/audit_helper.php';

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
        $limit = min(5, max(1, (int) ($_GET['limit'] ?? 5)));
        $sort  = ($_GET['sort'] ?? 'newest') === 'oldest' ? 'oldest' : 'newest';
        $type  = !empty($_GET['type']) ? trim($_GET['type']) : null;
        $role  = $_SESSION['role_name'] ?? '';

        if ($role === 'Company User') {
            $companyId = $_SESSION['company_id'] ?? null;
            if (!$companyId) {
                $this->jsonResponse(['message' => 'No client linked to this account.'], 400);
            }
            $this->jsonResponse($this->extModel->findPaginated($page, $limit, 'all', $sort, $type, (int) $companyId));
        }

        AuthMiddleware::hasRoleOrPermission(['Super Admin'], 'manage_inventory');
        $statusMap = ['in_stock' => true, 'allocated' => true, 'all' => true];
        $status = isset($statusMap[$_GET['status'] ?? '']) ? $_GET['status'] : 'in_stock';
        $this->jsonResponse($this->extModel->findPaginated($page, $limit, $status, $sort, $type));
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
        AuditHelper::log('create', 'extinguisher', null, 'Bulk registration', "Registered {$count} units");
        $this->jsonResponse(['message' => "Registered $count units", 'results' => $results], 201);
    }

    private function createSingle($data, $isBulk = false)
    {
        require_once __DIR__ . '/../helpers/qr_helper.php';

        if (!$this->validateRequiredParams(['type', 'capacity'], $data)) {
            if ($isBulk) return ['error' => 'Missing fields'];
            $this->jsonResponse(["message" => "Type and capacity required"], 400);
        }

        $priceModel = new ProductPrice();
        if (!$priceModel->validateType($data['type'])) {
            if ($isBulk) return ['error' => 'Invalid type'];
            $this->jsonResponse(['message' => 'Invalid type. Use Water, CO2, Powder, or Foam.'], 400);
        }
        if (!$priceModel->validateCapacity($data['capacity'])) {
            if ($isBulk) return ['error' => 'Invalid capacity'];
            $this->jsonResponse(['message' => 'Capacity must be 6, 9, or 12 kg'], 400);
        }

        $data['capacity'] = $priceModel->normalizeCapacity($data['capacity']);
        $unitPrice = $priceModel->getPrice($data['type'], $data['capacity']);
        if ($unitPrice === null) {
            if ($isBulk) return ['error' => 'Price not configured'];
            $this->jsonResponse(['message' => 'Price not configured for this type and capacity'], 400);
        }
        $data['price'] = $unitPrice;

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
        AuditHelper::log('create', 'extinguisher', (int) $id, $data['serial_number'],
            "{$data['type']} {$data['capacity']} kg");
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
            AuditHelper::log('update', 'extinguisher', (int) $id, $ext['serial_number'] ?? "Unit #{$id}", 'Inventory updated');
            $this->jsonResponse(['message' => 'Updated']);
        }
        $this->jsonResponse(["message" => "Update failed"], 500);
    }

    public function destroy($id)
    {
        AuthMiddleware::hasRoleOrPermission(['Super Admin'], 'manage_inventory');
        $ext = $this->extModel->findById($id);
        if (!$ext) {
            $this->jsonResponse(["message" => "Not found"], 404);
        }
        $this->extModel->logMovement($id, 'removed', $_SESSION['user_id'], $ext['serial_number']);
        if ($this->extModel->delete($id)) {
            AuditHelper::log('delete', 'extinguisher', (int) $id, $ext['serial_number'], 'Unit removed from inventory');
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
        if (!$ext) {
            $this->jsonResponse(["message" => "Not found"], 404);
        }

        $role = $_SESSION['role_name'] ?? '';
        if ($role === 'Company User') {
            $companyId = (int) ($_SESSION['company_id'] ?? 0);
            if (!$companyId || (int) $ext['client_id'] !== $companyId) {
                $this->jsonResponse(["message" => "Forbidden"], 403);
            }
        }

        $this->jsonResponse($ext);
    }

    public function assignLocation($id)
    {
        AuthMiddleware::check();
        if (($_SESSION['role_name'] ?? '') !== 'Company User') {
            $this->jsonResponse(['message' => 'Forbidden. Client access only.'], 403);
        }

        $companyId = (int) ($_SESSION['company_id'] ?? 0);
        if (!$companyId) {
            $this->jsonResponse(['message' => 'No client linked to this account.'], 400);
        }

        $ext = is_numeric($id)
            ? $this->extModel->findById($id)
            : $this->extModel->findBySerialNumber($id);
        if (!$ext) {
            $this->jsonResponse(['message' => 'Unit not found.'], 404);
        }

        $data = $this->getJsonInput();
        $locationId = array_key_exists('location_id', $data) && $data['location_id'] !== null
            ? (int) $data['location_id']
            : null;

        $result = $this->extModel->assignLocation((int) $ext['id'], $locationId, $companyId);
        if (!$result['ok']) {
            $this->jsonResponse(['message' => $result['message']], 400);
        }

        $updated = $this->extModel->findById($ext['id']);
        $this->jsonResponse(['message' => 'Location updated.', 'extinguisher' => $updated]);
    }
}
