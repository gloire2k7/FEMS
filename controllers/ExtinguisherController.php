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
        $extinguishers = $this->extModel->findAll();
        $this->jsonResponse($extinguishers);
    }

    public function store()
    {
        AuthMiddleware::hasRole(['Super Admin', 'Admin']);
        $data = $this->getJsonInput();

        return $this->createSingle($data);
    }

    public function bulkStore()
    {
        AuthMiddleware::hasRole(['Super Admin', 'Admin']);
        $data = $this->getJsonInput();

        if (!isset($data['count']) || !is_numeric($data['count'])) {
            $this->jsonResponse(["message" => "Count is required for bulk registration"], 400);
        }

        $count = (int)$data['count'];
        if ($count < 2 || $count > 100) {
            $this->jsonResponse(["message" => "Count must be between 2 and 100"], 400);
        }

        $results = [];
        for ($i = 0; $i < $count; $i++) {
            $results[] = $this->createSingle($data, true);
        }

        $this->jsonResponse([
            "message" => "Successfully registered $count extinguishers",
            "results" => $results
        ], 201);
    }

    private function createSingle($data, $isBulk = false)
    {
        require_once __DIR__ . '/../helpers/qr_helper.php';

        if (!$this->validateRequiredParams(['type', 'capacity', 'price'], $data)) {
            if ($isBulk)
                return ["error" => "Missing required fields"];
            $this->jsonResponse(["message" => "Type, capacity and price are required fields"], 400);
        }

        $data['client_id'] = isset($data['client_id']) ? $data['client_id'] : null;

        // Generate unique serial number (e.g., FEMS-YYYYMMDD-uniqid)
        $data['serial_number'] = 'FEMS-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -5));
        $data['qr_code_path'] = '/uploads/qrcodes/' . $data['serial_number'] . '.png';

        if (!empty($data['manufacturing_date']) && !empty($data['filling_date'])) {
            if (strtotime($data['manufacturing_date']) > strtotime($data['filling_date'])) {
                if ($isBulk)
                    return ["error" => "Invalid dates"];
                $this->jsonResponse(["message" => "Manufacturing date cannot be after filling date"], 400);
            }
        }

        $id = $this->extModel->create($data);
        if ($id) {
            // Generate QR Code
            $qrPath = QRHelper::generate($id, $data['serial_number']);

            // PDF Inspection Label generation is now deferred to the Order Flow stage.
            $pdfPath = null;

            // Update record with actual file paths
            $ext = $this->extModel->findById($id);
            $ext['qr_code_path'] = $qrPath;
            $ext['label_pdf_path'] = $pdfPath;
            $this->extModel->update($id, $ext);

            $result = [
                "id" => $id,
                "serial_number" => $data['serial_number'],
                "qr_path" => $qrPath,
                "pdf_path" => $pdfPath
            ];

            if ($isBulk)
                return $result;

            $this->jsonResponse(array_merge(["message" => "Extinguisher created successfully"], $result), 201);
        }

        if ($isBulk)
            return ["error" => "Creation failed"];
        $this->jsonResponse(["message" => "Failed to create extinguisher"], 500);
    }

    public function update($id)
    {
        AuthMiddleware::hasRole(['Super Admin', 'Admin']);
        $data = $this->getJsonInput();

        $ext = $this->extModel->findById($id);
        if (!$ext) {
            $this->jsonResponse(["message" => "Extinguisher not found"], 404);
        }

        if ($this->extModel->update($id, array_merge($ext, $data))) {
            $this->jsonResponse(["message" => "Extinguisher updated successfully"]);
        }
        $this->jsonResponse(["message" => "Update failed"], 500);
    }

    public function destroy($id)
    {
        AuthMiddleware::hasRole(['Super Admin']);

        $ext = $this->extModel->findById($id);
        if (!$ext) {
            $this->jsonResponse(["message" => "Extinguisher not found"], 404);
        }

        // Cleanup files
        if (!empty($ext['qr_code_path'])) {
            $file = __DIR__ . '/..' . $ext['qr_code_path'];
            if (file_exists($file))
                unlink($file);
        }
        if (!empty($ext['label_pdf_path'])) {
            $file = __DIR__ . '/..' . $ext['label_pdf_path'];
            if (file_exists($file))
                unlink($file);
        }

        if ($this->extModel->delete($id)) {
            $this->jsonResponse(["message" => "Extinguisher deleted"]);
        }
        $this->jsonResponse(["message" => "Deletion failed"], 500);
    }

    public function show($id)
    {
        AuthMiddleware::check();
        
        if (is_numeric($id)) {
            $ext = $this->extModel->findById($id);
        } else {
            $ext = $this->extModel->findBySerialNumber($id);
        }

        if ($ext) {
            $this->jsonResponse($ext);
        }
        $this->jsonResponse(["message" => "Extinguisher not found"], 404);
    }
}
