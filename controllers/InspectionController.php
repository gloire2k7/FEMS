<?php

class InspectionController extends Controller
{
    private $inspectionModel;
    private $extModel;

    public function __construct()
    {
        $this->inspectionModel = new Inspection();
        $this->extModel = new Extinguisher();
    }

    public function index()
    {
        AuthMiddleware::check();
        $inspections = $this->inspectionModel->findAll();
        $this->jsonResponse($inspections);
    }

    public function store()
    {
        AuthMiddleware::check(); // Allow any logged-in user/inspector
        $data = $this->getJsonInput();

        if (!$this->validateRequiredParams(['extinguisher_id', 'result_status', 'inspection_date', 'next_due_date'], $data)) {
            $this->jsonResponse(["message" => "Missing required inspection fields"], 400);
        }

        $data['inspector_id'] = $_SESSION['user_id'];

        // Handle Status Determination Logic 
        // Example: if expiry_date < today -> expired
        // It's checked and set from frontend payload primarily.

        $id = $this->inspectionModel->create($data);

        if ($id) {
            // Auto Update Extinguisher Status based on inspection result
            $newStatus = 'filled'; // default assumption if passed

            if ($data['result_status'] === 'requires_refill') {
                $newStatus = 'unfilled';
            }
            elseif ($data['result_status'] === 'condemned') {
                $newStatus = 'condemned';
            }
            elseif ($data['result_status'] === 'expired') {
                $newStatus = 'expired';
            }

            $this->extModel->updateStatus($data['extinguisher_id'], $newStatus);

            $this->jsonResponse(["message" => "Inspection recorded and extinguisher status updated", "id" => $id], 201);
        }
        $this->jsonResponse(["message" => "Failed to record inspection"], 500);
    }
}
