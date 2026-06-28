<?php

require_once __DIR__ . '/../helpers/notification_helper.php';

class InspectionAssignmentController extends Controller
{
    private $assignmentModel;
    private $extModel;

    public function __construct()
    {
        $this->assignmentModel = new InspectionAssignment();
        $this->extModel = new Extinguisher();
    }

    public function stats()
    {
        AuthMiddleware::check();
        if (($_SESSION['role_name'] ?? '') !== 'Inspector') {
            $this->jsonResponse(['message' => 'Forbidden'], 403);
        }
        $this->jsonResponse($this->assignmentModel->getInspectorStats($_SESSION['user_id']));
    }

    public function index()
    {
        AuthMiddleware::check();
        $role = $_SESSION['role_name'] ?? '';
        $page = max(1, (int) ($_GET['page'] ?? 1));
        $limit = min(5, max(1, (int) ($_GET['limit'] ?? 5)));

        if ($role === 'Inspector') {
            if (!empty($_GET['pool'])) {
                $this->jsonResponse($this->assignmentModel->findPoolPaginated($page, $limit));
            }
            $status = $_GET['status'] ?? null;
            $this->jsonResponse(
                $this->assignmentModel->findByInspectorPaginated($_SESSION['user_id'], $page, $limit, $status)
            );
        }

        AuthMiddleware::hasPermission('inspections.assign');
        $this->jsonResponse($this->assignmentModel->findAllPaginated($page, $limit));
    }

    public function store()
    {
        AuthMiddleware::hasPermission('inspections.assign');
        $data = $this->getJsonInput();

        if (!$this->validateRequiredParams(['extinguisher_id'], $data)) {
            $this->jsonResponse(['message' => 'extinguisher_id is required'], 400);
        }

        $ext = $this->extModel->findById($data['extinguisher_id']);
        if (!$ext) {
            $this->jsonResponse(['message' => 'Extinguisher not found'], 404);
        }

        $payload = [
            'extinguisher_id' => (int) $data['extinguisher_id'],
            'assigned_by'     => (int) $_SESSION['user_id'],
            'due_date'        => $data['due_date'] ?? null,
        ];

        $id = $this->assignmentModel->create($payload);
        if (!$id) {
            $this->jsonResponse(['message' => 'Failed to create inspection assignment'], 500);
        }

        $this->jsonResponse([
            'message'    => 'Inspection assignment created',
            'assignment' => $this->assignmentModel->findById($id),
        ], 201);
    }

    public function claim($id)
    {
        AuthMiddleware::check();
        if (($_SESSION['role_name'] ?? '') !== 'Inspector') {
            $this->jsonResponse(['message' => 'Forbidden'], 403);
        }

        $data = $this->getJsonInput();
        if (!$this->validateRequiredParams(['confirmed_date'], $data)) {
            $this->jsonResponse(['message' => 'Confirmed date is required.'], 400);
        }

        $assignment = $this->assignmentModel->findById($id);
        if (!$assignment) {
            $this->jsonResponse(['message' => 'Inspection not found.'], 404);
        }

        $inspectorId = (int) $_SESSION['user_id'];
        $confirmedDate = $data['confirmed_date'];
        $batchId = !empty($data['batch_id']) ? (int) $data['batch_id'] : null;
        $assignmentId = !empty($data['assignment_id']) ? (int) $data['assignment_id'] : (int) $id;

        $requestModel = new ServiceRequest();
        if ($requestModel->inspectorHasConflict($inspectorId, $confirmedDate, $batchId)) {
            $this->jsonResponse(['message' => 'You already have an inspection scheduled on that date.'], 409);
        }

        if (!$this->assignmentModel->claimBatch($batchId, $assignmentId, $inspectorId, $confirmedDate)) {
            $this->jsonResponse(['message' => 'Could not claim this inspection. It may already be taken.'], 409);
        }

        if ($batchId) {
            $batchModel = new ServiceRequestBatch();
            $batchModel->scheduleInspection($batchId, $inspectorId, $inspectorId, $confirmedDate);
            $requestModel->scheduleBatchItems($batchId, $inspectorId, $inspectorId, $confirmedDate);
        } elseif (!empty($assignment['service_request_id'])) {
            $requestModel->scheduleInspection(
                $assignment['service_request_id'],
                $inspectorId,
                $inspectorId,
                $confirmedDate
            );
        }

        $this->jsonResponse([
            'message'    => 'Inspection assigned to you',
            'assignment' => $this->assignmentModel->findById($assignmentId),
        ]);
    }

    public function complete($id)
    {
        AuthMiddleware::check();
        if (($_SESSION['role_name'] ?? '') !== 'Inspector') {
            $this->jsonResponse(['message' => 'Forbidden'], 403);
        }

        $data = $this->getJsonInput();
        if (!$this->validateRequiredParams(['result_status'], $data)) {
            $this->jsonResponse(['message' => 'result_status is required'], 400);
        }

        $allowed = ['passed', 'requires_refill', 'expired', 'condemned'];
        if (!in_array($data['result_status'], $allowed, true)) {
            $this->jsonResponse(['message' => 'Invalid result_status'], 400);
        }

        $assignment = $this->assignmentModel->findById($id);
        if (!$assignment || (int) $assignment['inspector_id'] !== (int) $_SESSION['user_id']) {
            $this->jsonResponse(['message' => 'Assignment not found'], 404);
        }

        if (!$this->assignmentModel->complete($id, $_SESSION['user_id'], $data)) {
            $this->jsonResponse(['message' => 'Could not complete this inspection'], 400);
        }

        $newStatus = 'filled';
        if ($data['result_status'] === 'requires_refill') {
            $newStatus = 'unfilled';
        } elseif ($data['result_status'] === 'condemned') {
            $newStatus = 'condemned';
        } elseif ($data['result_status'] === 'expired') {
            $newStatus = 'expired';
        }
        $this->extModel->updateStatus($assignment['extinguisher_id'], $newStatus);

        if (!empty($assignment['service_request_id'])) {
            $requestModel = new ServiceRequest();
            $requestModel->markAwaitingClient($assignment['service_request_id'], [
                'inspector_notes' => $data['notes'] ?? null,
                'result_status'   => $data['result_status'],
            ]);
            $req = $requestModel->findById($assignment['service_request_id']);
            if (!empty($req['batch_id'])) {
                $items = $requestModel->findByBatchId($req['batch_id']);
                $allDone = count($items) > 0 && !array_filter($items, fn($i) => !in_array($i['status'], ['awaiting_client', 'completed'], true));
                if ($allDone) {
                    $batchModel = new ServiceRequestBatch();
                    $batchModel->markAwaitingClient($req['batch_id']);
                    NotificationHelper::notifyCompanyUsers(
                        (int) $req['client_id'],
                        'info',
                        'Inspection completed',
                        "Inspection batch #{$req['batch_id']} is complete. Please confirm on your service requests page.",
                        '/service-requests',
                        'inspection_batch',
                        (int) $req['batch_id'],
                        "insp_done_batch:{$req['batch_id']}"
                    );
                }
            } elseif ($req) {
                NotificationHelper::notifyCompanyUsers(
                    (int) $req['client_id'],
                    'info',
                    'Inspection completed',
                    "Inspection for unit {$assignment['serial_number']} is awaiting your confirmation.",
                    '/service-requests',
                    'service_request',
                    (int) $assignment['service_request_id'],
                    "insp_done:{$assignment['service_request_id']}"
                );
            }
            NotificationHelper::notifyByPermission('inspections.view', 'info', 'Inspection submitted',
                "Inspector submitted results for {$assignment['serial_number']}.",
                '/admin-assigned-inspections',
                'inspection',
                (int) $id,
                "insp_submitted:{$id}"
            );
        }

        $this->jsonResponse([
            'message'    => 'Inspection submitted. Awaiting client confirmation.',
            'assignment' => $this->assignmentModel->findById($id),
        ]);
    }
}
