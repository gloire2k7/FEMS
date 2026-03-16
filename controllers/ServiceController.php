<?php

class ServiceController extends Controller
{
    private $extModel;
    private $maintenanceModel;

    public function __construct()
    {
        $this->extModel = new Extinguisher();
        $this->maintenanceModel = new Maintenance();
    }

    // Client Request Refill
    public function requestRefill($id)
    {
        AuthMiddleware::hasRole(['Company User']);
        $user = $_SESSION['user_id'];
        $company_id = $_SESSION['company_id'];

        $ext = $this->extModel->findById($id);
        if (!$ext) {
            $this->jsonResponse(["message" => "Extinguisher not found"], 404);
        }

        if ($ext['client_id'] != $company_id) {
            $this->jsonResponse(["message" => "Unauthorized access to this extinguisher"], 403);
        }

        if ($this->extModel->updateStatus($id, 'requires_refill')) {
            $this->jsonResponse(["message" => "Refill request submitted successfully"]);
        }
        $this->jsonResponse(["message" => "Failed to submit refill request"], 500);
    }

    // Client Request Maintenance
    public function requestMaintenance($id)
    {
        AuthMiddleware::hasRole(['Company User']);
        $company_id = $_SESSION['company_id'];

        $ext = $this->extModel->findById($id);
        if (!$ext) {
            $this->jsonResponse(["message" => "Extinguisher not found"], 404);
        }

        if ($ext['client_id'] != $company_id) {
            $this->jsonResponse(["message" => "Unauthorized access to this extinguisher"], 403);
        }

        if ($this->extModel->updateStatus($id, 'requires_maintenance')) {
            $this->jsonResponse(["message" => "Maintenance request submitted successfully"]);
        }
        $this->jsonResponse(["message" => "Failed to submit maintenance request"], 500);
    }

    // Admin Confirm Request (requires_refill -> unfilled or requires_maintenance -> under_maintenance)
    public function confirmRequest($id)
    {
        AuthMiddleware::hasRole(['Super Admin', 'Admin']);

        $ext = $this->extModel->findById($id);
        if (!$ext) {
            $this->jsonResponse(["message" => "Extinguisher not found"], 404);
        }

        $newStatus = null;
        if ($ext['status'] === 'requires_refill') {
            $newStatus = 'unfilled';
        }
        elseif ($ext['status'] === 'requires_maintenance') {
            $newStatus = 'under_maintenance';
        }
        else {
            $this->jsonResponse(["message" => "No pending request for this extinguisher"], 400);
        }

        if ($this->extModel->updateStatus($id, $newStatus)) {
            $this->jsonResponse(["message" => "Request confirmed. Status updated to " . $newStatus]);
        }
        $this->jsonResponse(["message" => "Failed to confirm request"], 500);
    }

    // Admin Complete Service (Return to filled + Record)
    public function completeService($id)
    {
        AuthMiddleware::hasRole(['Super Admin', 'Admin']);
        $data = $this->getJsonInput();
        $admin_id = $_SESSION['user_id'];

        $ext = $this->extModel->findById($id);
        if (!$ext) {
            $this->jsonResponse(["message" => "Extinguisher not found"], 404);
        }

        $service_type = null;
        if ($ext['status'] === 'unfilled') {
            $service_type = 'Refill';
        }
        elseif ($ext['status'] === 'under_maintenance') {
            $service_type = 'Maintenance';
        }
        else {
            $this->jsonResponse(["message" => "Extinguisher is not currently undergoing service"], 400);
        }

        // Update status back to filled
        if ($this->extModel->updateStatus($id, 'filled')) {
            // Record in maintenance history
            $this->maintenanceModel->create([
                'extinguisher_id' => $id,
                'service_type' => $service_type,
                'description' => isset($data['description']) ? $data['description'] : "Completed $service_type",
                'service_date' => date('Y-m-d'),
                'performed_by' => $admin_id
            ]);

            $this->jsonResponse(["message" => "$service_type completed successfully"]);
        }
        $this->jsonResponse(["message" => "Failed to complete service"], 500);
    }
}
