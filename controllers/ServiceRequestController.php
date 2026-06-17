<?php

require_once __DIR__ . '/../helpers/notification_helper.php';

class ServiceRequestController extends Controller
{
    private $requestModel;
    private $batchModel;
    private $extModel;
    private $assignmentModel;
    private $feeModel;

    public function __construct()
    {
        $this->requestModel = new ServiceRequest();
        $this->batchModel = new ServiceRequestBatch();
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

        if ($type === 'mandatory') {
            $this->jsonResponse($this->requestModel->findMandatoryPaginatedByClient($clientId, $page, $limit));
        }

        $this->jsonResponse($this->batchModel->findPaginatedByClient($clientId, $page, $limit, $type));
    }

    public function store()
    {
        $clientId = $this->requireClientId();
        $data = $this->getJsonInput();

        $serials = [];
        if (!empty($data['serial_numbers']) && is_array($data['serial_numbers'])) {
            $serials = array_values(array_filter(array_map('trim', $data['serial_numbers'])));
        } elseif (!empty($data['serial_number'])) {
            $serials = [trim($data['serial_number'])];
        }

        if (!$serials || empty($data['service_type'])) {
            $this->jsonResponse(['message' => 'At least one serial number and service type are required.'], 400);
        }

        $type = strtolower(trim($data['service_type']));
        if (!in_array($type, ['inspection', 'refill', 'maintenance'], true)) {
            $this->jsonResponse(['message' => 'Invalid service type.'], 400);
        }

        $extIds = [];
        foreach ($serials as $serial) {
            $ext = $this->extModel->findBySerialNumber($serial);
            if (!$ext || (int) $ext['client_id'] !== $clientId) {
                $this->jsonResponse(['message' => "Unit not found or not yours: $serial"], 404);
            }
            if ($this->requestModel->hasActiveDuplicate((int) $ext['id'], $type)) {
                $this->jsonResponse(['message' => "Active request already exists for $serial"], 409);
            }
            $extIds[] = (int) $ext['id'];
        }

        $batchId = $this->batchModel->create([
            'client_id'      => $clientId,
            'service_type'   => $type,
            'preferred_date' => $data['preferred_date'] ?? null,
            'client_notes'   => $data['client_notes'] ?? null,
            'unit_count'     => count($extIds),
        ]);
        if (!$batchId) {
            $this->jsonResponse(['message' => 'Failed to create request batch.'], 500);
        }

        foreach ($extIds as $extId) {
            $reqId = $this->requestModel->create([
                'batch_id'        => $batchId,
                'client_id'       => $clientId,
                'extinguisher_id' => $extId,
                'service_type'    => $type,
                'preferred_date'  => $data['preferred_date'] ?? null,
                'client_notes'    => $data['client_notes'] ?? null,
            ]);
            if (!$reqId) {
                $this->jsonResponse(['message' => 'Failed to create request item.'], 500);
            }
            if ($type === 'inspection') {
                $this->assignmentModel->create([
                    'extinguisher_id'    => $extId,
                    'assigned_by'        => null,
                    'due_date'           => $data['preferred_date'] ?? null,
                    'service_request_id' => $reqId,
                ]);
            }
        }

        $batch = $this->batchModel->findById($batchId);
        $unitLabel = count($extIds) === 1 ? '1 unit' : count($extIds) . ' units';
        $perm = $type === 'inspection' ? 'manage_inspections' : 'manage_refills';
        $link = $type === 'inspection' ? '/admin-assigned-inspections' : '/admin-refills';
        NotificationHelper::notifyByPermission(
            $perm,
            'info',
            'New service request',
            "{$batch['company_name']} submitted a {$type} request for {$unitLabel}.",
            $link,
            'service_batch',
            (int) $batchId,
            "batch_submitted:{$batchId}"
        );

        $this->jsonResponse([
            'message' => count($extIds) > 1
                ? 'Batch service request submitted for ' . count($extIds) . ' units.'
                : 'Service request submitted.',
            'batch' => $this->batchModel->findById($batchId),
        ], 201);
    }

    public function confirmDone($id)
    {
        $clientId = $this->requireClientId();
        $data = $this->getJsonInput();
        $kind = $data['kind'] ?? 'batch';

        if ($kind === 'mandatory') {
            $instanceId = (int) ($data['mandatory_instance_id'] ?? $id);
            if (!$this->requestModel->clientConfirmMandatory($instanceId, $clientId)) {
                $this->jsonResponse(['message' => 'Cannot confirm this request.'], 400);
            }
            $instanceModel = new MandatoryInspectionInstance();
            $instanceModel->clientConfirm($instanceId, $clientId);
            $assignmentModel = new MandatoryClientAssignment();
            $instance = $instanceModel->findById($instanceId);
            if ($instance) {
                $assignmentModel->updateLastCompleted($instance['assignment_id'], date('Y-m-d'));
                $this->spawnNextMandatoryInstance($instance['assignment_id']);
            }
            $this->jsonResponse(['message' => 'Mandatory inspection confirmed as done.']);
        }

        $batchId = (int) $id;
        if (!$this->requestModel->clientConfirmBatchDone($batchId, $clientId)) {
            $this->jsonResponse(['message' => 'Cannot confirm this request.'], 400);
        }
        $this->batchModel->clientConfirmDone($batchId, $clientId);
        $items = $this->requestModel->findByBatchId($batchId);
        foreach ($items as $req) {
            if ($req['service_type'] === 'inspection' && $req['result_status'] === 'passed') {
                $this->extModel->updateStatus($req['extinguisher_id'], 'filled');
            } elseif ($req['service_type'] === 'refill') {
                $this->extModel->updateStatus($req['extinguisher_id'], 'filled');
            } elseif ($req['service_type'] === 'maintenance') {
                $this->extModel->updateStatus($req['extinguisher_id'], 'filled');
            }
        }
        $this->jsonResponse(['message' => 'Request marked as done.', 'batch' => $this->batchModel->findById($batchId)]);
    }

    public function refills()
    {
        AuthMiddleware::hasRoleOrPermission(['Super Admin'], 'manage_refills');
        $page = max(1, (int) ($_GET['page'] ?? 1));
        $limit = min(50, max(1, (int) ($_GET['limit'] ?? 10)));
        $status = !empty($_GET['status']) ? $_GET['status'] : null;
        $result = $this->batchModel->findPaginatedForAdmin(['refill', 'maintenance'], $page, $limit, $status);
        $result['fees'] = $this->feeModel->getAll();
        $this->jsonResponse($result);
    }

    public function pendingInspections()
    {
        AuthMiddleware::hasRoleOrPermission(['Super Admin'], 'manage_inspections');
        $page = max(1, (int) ($_GET['page'] ?? 1));
        $limit = min(50, max(1, (int) ($_GET['limit'] ?? 10)));
        $this->jsonResponse($this->batchModel->findPaginatedForAdmin(['inspection'], $page, $limit, 'pending'));
    }

    public function assignedInspections()
    {
        AuthMiddleware::hasRoleOrPermission(['Super Admin'], 'manage_inspections');
        $page = max(1, (int) ($_GET['page'] ?? 1));
        $limit = min(50, max(1, (int) ($_GET['limit'] ?? 10)));
        $status = !empty($_GET['status']) ? $_GET['status'] : 'scheduled';
        if (!in_array($status, ['scheduled', 'awaiting_client', 'completed'], true)) {
            $status = 'scheduled';
        }
        $this->jsonResponse($this->batchModel->findPaginatedForAdmin(['inspection'], $page, $limit, $status));
    }

    public function schedule($id)
    {
        AuthMiddleware::hasRoleOrPermission(['Super Admin'], 'manage_refills');
        $data = $this->getJsonInput();
        if (!$this->validateRequiredParams(['confirmed_date'], $data)) {
            $this->jsonResponse(['message' => 'Confirmed date is required.'], 400);
        }

        $batch = $this->batchModel->findById($id);
        if (!$batch || !in_array($batch['service_type'], ['refill', 'maintenance'], true)) {
            $this->jsonResponse(['message' => 'Request not found.'], 404);
        }

        $fee = isset($data['fee']) ? (float) $data['fee'] : $this->feeModel->getFee($batch['service_type']);
        $items = $this->requestModel->findByBatchId($id);
        foreach ($items as $req) {
            $this->requestModel->scheduleRefillMaintenance($req['id'], $data['confirmed_date'], $fee);
            $statusMap = ['refill' => 'requires_refill', 'maintenance' => 'under_maintenance'];
            $this->extModel->updateStatus($req['extinguisher_id'], $statusMap[$batch['service_type']] ?? 'under_maintenance');
        }
        $db = Database::getConnection();
        $db->prepare(
            "UPDATE service_request_batches SET confirmed_date = ?, status = 'scheduled' WHERE id = ?"
        )->execute([$data['confirmed_date'], (int) $id]);

        $batch = $this->batchModel->findById($id);
        NotificationHelper::notifyCompanyUsers(
            (int) $batch['client_id'],
            'info',
            ucfirst($batch['service_type']) . ' scheduled',
            "Your {$batch['service_type']} for {$batch['unit_count']} unit(s) is scheduled for {$data['confirmed_date']}.",
            '/service-requests',
            'service_batch',
            (int) $id,
            "batch_scheduled:{$id}"
        );

        $this->jsonResponse(['message' => 'Date confirmed.', 'batch' => $batch]);
    }

    public function markDone($id)
    {
        AuthMiddleware::hasRoleOrPermission(['Super Admin'], 'manage_refills');
        $batch = $this->batchModel->findById($id);
        if (!$batch || !in_array($batch['service_type'], ['refill', 'maintenance'], true)) {
            $this->jsonResponse(['message' => 'Request not found.'], 404);
        }
        $this->requestModel->markBatchAwaitingClient($id);
        $this->batchModel->markAwaitingClient($id);
        $batch = $this->batchModel->findById($id);
        NotificationHelper::notifyCompanyUsers(
            (int) $batch['client_id'],
            'info',
            'Service complete — please confirm',
            "Your {$batch['service_type']} for {$batch['unit_count']} unit(s) is done. Confirm completion in your portal.",
            '/service-requests',
            'service_batch',
            (int) $id,
            "batch_awaiting_client:{$id}"
        );
        $this->jsonResponse(['message' => 'Service marked complete. Awaiting client confirmation.', 'batch' => $batch]);
    }

    public function assignInspection($id)
    {
        AuthMiddleware::hasRoleOrPermission(['Super Admin'], 'manage_inspections');
        $data = $this->getJsonInput();
        if (!$this->validateRequiredParams(['inspector_id', 'confirmed_date'], $data)) {
            $this->jsonResponse(['message' => 'Inspector and confirmed date are required.'], 400);
        }

        $batch = $this->batchModel->findById($id);
        if (!$batch || $batch['service_type'] !== 'inspection' || $batch['status'] !== 'pending') {
            $this->jsonResponse(['message' => 'Pending inspection batch not found.'], 404);
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

        $this->batchModel->scheduleInspection($id, $inspectorId, (int) $_SESSION['user_id'], $confirmedDate);
        $this->requestModel->scheduleBatchItems($id, $inspectorId, (int) $_SESSION['user_id'], $confirmedDate);
        $this->assignmentModel->assignBatchWithDate($id, $inspectorId, (int) $_SESSION['user_id'], $confirmedDate);

        $batch = $this->batchModel->findById($id);
        $unitLabel = (int) $batch['unit_count'] === 1 ? '1 unit' : "{$batch['unit_count']} units";
        NotificationHelper::notifyInspector(
            $inspectorId,
            'info',
            'Inspection batch assigned',
            "{$batch['company_name']} — {$unitLabel} on {$confirmedDate}.",
            '/inspector-inspections',
            'service_batch',
            (int) $id,
            "batch_assigned_inspector:{$id}"
        );
        NotificationHelper::notifyCompanyUsers(
            (int) $batch['client_id'],
            'info',
            'Inspector assigned',
            "{$inspector['name']} will inspect {$unitLabel} on {$confirmedDate}.",
            '/service-requests',
            'service_batch',
            (int) $id,
            "batch_assigned_client:{$id}"
        );

        $this->jsonResponse(['message' => 'Inspector assigned to batch.', 'batch' => $batch]);
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

    private function spawnNextMandatoryInstance($assignmentId)
    {
        $assignmentModel = new MandatoryClientAssignment();
        $instanceModel = new MandatoryInspectionInstance();
        $assignment = $assignmentModel->findById($assignmentId);
        if (!$assignment) {
            return;
        }
        if ($instanceModel->hasActiveForAssignment($assignmentId)) {
            return;
        }
        $due = new DateTime($assignment['last_completed_at'] ?? 'now');
        $due->modify('+' . (int) $assignment['interval_months'] . ' months');
        $deadline = clone $due;
        $deadline->modify('+' . (int) $assignment['deadline_days'] . ' days');
        $instanceId = $instanceModel->create($assignmentId, $due->format('Y-m-d'), $deadline->format('Y-m-d'));
        if ($instanceId) {
            $this->requestModel->createMandatoryPlaceholder(
                (int) $assignment['client_id'],
                $instanceId,
                $due->format('Y-m-d'),
                'Mandatory: ' . $assignment['mandatory_name']
            );
        }
    }
}
