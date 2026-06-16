<?php

class ServiceRequestController extends Controller
{
    private $requestModel;
    private $extModel;
    private $assignmentModel;
    private $feeModel;

    public function __construct()
    {
        $this->requestModel = new ServiceRequest();
        $this->extModel = new Extinguisher();
        $this->assignmentModel = new InspectionAssignment();
        $this->feeModel = new ServiceFee();
    }

    private function requireClientId()
    {
        AuthMiddleware::check();
        if (($_SESSION['role_name'] ?? '') !== 'Company User') {
            $this->jsonResponse(['message' => 'Forbidden'], 403);
        }
        $companyId = (int) ($_SESSION['company_id'] ?? 0);
        if (!$companyId) {
            $this->jsonResponse(['message' => 'No client linked to this account.'], 400);
        }
        return $companyId;
    }

    public function index()
    {
        $clientId = $this->requireClientId();
        $page = max(1, (int) ($_GET['page'] ?? 1));
        $limit = min(50, max(1, (int) ($_GET['limit'] ?? 5)));
        $type = !empty($_GET['type']) ? $_GET['type'] : null;
        $this->jsonResponse($this->requestModel->findPaginatedByClient($clientId, $page, $limit, $type));
    }

    public function store()
    {
        $clientId = $this->requireClientId();
        $data = $this->getJsonInput();

        if (!$this->validateRequiredParams(['serial_number', 'service_type'], $data)) {
            $this->jsonResponse(['message' => 'Serial number and service type are required.'], 400);
        }

        $type = strtolower(trim($data['service_type']));
        if (!in_array($type, ['inspection', 'refill', 'maintenance'], true)) {
            $this->jsonResponse(['message' => 'Invalid service type.'], 400);
        }

        $ext = $this->extModel->findBySerialNumber(trim($data['serial_number']));
        if (!$ext || (int) $ext['client_id'] !== $clientId) {
            $this->jsonResponse(['message' => 'Unit not found or does not belong to your account.'], 404);
        }

        if ($this->requestModel->hasActiveDuplicate($ext['id'], $type)) {
            $this->jsonResponse(['message' => 'An active request of this type already exists for this unit.'], 409);
        }

        $payload = [
            'client_id'       => $clientId,
            'extinguisher_id' => (int) $ext['id'],
            'service_type'    => $type,
            'preferred_date'  => $data['preferred_date'] ?? null,
            'client_notes'    => $data['client_notes'] ?? null,
        ];

        $id = $this->requestModel->create($payload);
        if (!$id) {
            $this->jsonResponse(['message' => 'Failed to create request.'], 500);
        }

        if ($type === 'inspection') {
            $this->assignmentModel->create([
                'extinguisher_id'    => (int) $ext['id'],
                'assigned_by'        => null,
                'due_date'           => $payload['preferred_date'],
                'service_request_id' => $id,
            ]);
        }

        $this->jsonResponse([
            'message' => 'Service request submitted.',
            'request' => $this->requestModel->findById($id),
        ], 201);
    }

    public function confirmDone($id)
    {
        $clientId = $this->requireClientId();
        if (!$this->requestModel->clientConfirmDone($id, $clientId)) {
            $this->jsonResponse(['message' => 'Cannot confirm this request.'], 400);
        }
        $req = $this->requestModel->findById($id);
        if ($req['service_type'] === 'inspection' && $req['result_status'] === 'passed') {
            $this->extModel->updateStatus($req['extinguisher_id'], 'filled');
        } elseif ($req['service_type'] === 'refill') {
            $this->extModel->updateStatus($req['extinguisher_id'], 'filled');
        } elseif ($req['service_type'] === 'maintenance') {
            $this->extModel->updateStatus($req['extinguisher_id'], 'filled');
        }
        $this->jsonResponse(['message' => 'Request marked as done.', 'request' => $req]);
    }

    public function refills()
    {
        AuthMiddleware::hasRoleOrPermission(['Super Admin'], 'manage_refills');
        $page = max(1, (int) ($_GET['page'] ?? 1));
        $limit = min(50, max(1, (int) ($_GET['limit'] ?? 10)));
        $status = !empty($_GET['status']) ? $_GET['status'] : null;
        $result = $this->requestModel->findPaginatedForAdmin(['refill', 'maintenance'], $page, $limit, $status);
        $result['fees'] = $this->feeModel->getAll();
        $this->jsonResponse($result);
    }

    public function pendingInspections()
    {
        AuthMiddleware::hasRoleOrPermission(['Super Admin'], 'manage_inspections');
        $page = max(1, (int) ($_GET['page'] ?? 1));
        $limit = min(50, max(1, (int) ($_GET['limit'] ?? 10)));
        $this->jsonResponse($this->requestModel->findPendingInspectionsPaginated($page, $limit));
    }

    public function schedule($id)
    {
        AuthMiddleware::hasRoleOrPermission(['Super Admin'], 'manage_refills');
        $data = $this->getJsonInput();
        if (!$this->validateRequiredParams(['confirmed_date'], $data)) {
            $this->jsonResponse(['message' => 'Confirmed date is required.'], 400);
        }

        $req = $this->requestModel->findById($id);
        if (!$req || !in_array($req['service_type'], ['refill', 'maintenance'], true)) {
            $this->jsonResponse(['message' => 'Request not found.'], 404);
        }

        $fee = isset($data['fee']) ? (float) $data['fee'] : $this->feeModel->getFee($req['service_type']);

        if (!$this->requestModel->scheduleRefillMaintenance($id, $data['confirmed_date'], $fee)) {
            $this->jsonResponse(['message' => 'Could not schedule request.'], 400);
        }

        $statusMap = ['refill' => 'requires_refill', 'maintenance' => 'under_maintenance'];
        $this->extModel->updateStatus($req['extinguisher_id'], $statusMap[$req['service_type']] ?? 'under_maintenance');

        $this->jsonResponse(['message' => 'Date confirmed.', 'request' => $this->requestModel->findById($id)]);
    }

    public function markDone($id)
    {
        AuthMiddleware::hasRoleOrPermission(['Super Admin'], 'manage_refills');
        $req = $this->requestModel->findById($id);
        if (!$req || !in_array($req['service_type'], ['refill', 'maintenance'], true)) {
            $this->jsonResponse(['message' => 'Request not found.'], 404);
        }
        if (!$this->requestModel->markAwaitingClient($id)) {
            $this->jsonResponse(['message' => 'Request must be scheduled first.'], 400);
        }
        $this->jsonResponse(['message' => 'Service marked complete. Awaiting client confirmation.', 'request' => $this->requestModel->findById($id)]);
    }

    public function assignInspection($id)
    {
        AuthMiddleware::hasRoleOrPermission(['Super Admin'], 'manage_inspections');
        $data = $this->getJsonInput();
        if (!$this->validateRequiredParams(['inspector_id', 'confirmed_date'], $data)) {
            $this->jsonResponse(['message' => 'Inspector and confirmed date are required.'], 400);
        }

        $req = $this->requestModel->findById($id);
        if (!$req || $req['service_type'] !== 'inspection' || $req['status'] !== 'pending') {
            $this->jsonResponse(['message' => 'Pending inspection request not found.'], 404);
        }

        $inspectorId = (int) $data['inspector_id'];
        $confirmedDate = $data['confirmed_date'];

        if ($this->requestModel->inspectorHasConflict($inspectorId, $confirmedDate)) {
            $this->jsonResponse(['message' => 'This inspector already has an inspection scheduled on that date.'], 409);
        }

        $userModel = new User();
        $inspector = $userModel->findById($inspectorId);
        if (!$inspector || $inspector['role_name'] !== 'Inspector' || $inspector['status'] !== 'active') {
            $this->jsonResponse(['message' => 'Invalid or inactive inspector.'], 400);
        }

        if (!$this->requestModel->scheduleInspection($id, $inspectorId, (int) $_SESSION['user_id'], $confirmedDate)) {
            $this->jsonResponse(['message' => 'Failed to assign inspection.'], 500);
        }

        if (!empty($req['assignment_id'])) {
            $this->assignmentModel->assignWithDate($req['assignment_id'], $inspectorId, (int) $_SESSION['user_id'], $confirmedDate);
        }

        $this->jsonResponse(['message' => 'Inspector assigned.', 'request' => $this->requestModel->findById($id)]);
    }

    public function getFees()
    {
        AuthMiddleware::hasRoleOrPermission(['Super Admin'], 'manage_refills');
        $this->jsonResponse($this->feeModel->getAll());
    }

    public function updateFees()
    {
        AuthMiddleware::hasRoleOrPermission(['Super Admin'], 'manage_refills');
        $data = $this->getJsonInput();
        $this->feeModel->updateFees($data['refill_fee'] ?? 0, $data['maintenance_fee'] ?? 0);
        $this->jsonResponse(['message' => 'Fees updated.', 'fees' => $this->feeModel->getAll()]);
    }
}
