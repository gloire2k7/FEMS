<?php

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
        $limit = min(50, max(1, (int) ($_GET['limit'] ?? 10)));

        if ($role === 'Inspector') {
            if (!empty($_GET['pool'])) {
                $this->jsonResponse($this->assignmentModel->findPoolPaginated($page, $limit));
            }
            $status = $_GET['status'] ?? null;
            $this->jsonResponse(
                $this->assignmentModel->findByInspectorPaginated($_SESSION['user_id'], $page, $limit, $status)
            );
        }

        AuthMiddleware::hasRoleOrPermission(['Super Admin'], 'manage_inspections');
        $this->jsonResponse($this->assignmentModel->findAllPaginated($page, $limit));
    }

    public function store()
    {
        AuthMiddleware::hasRoleOrPermission(['Super Admin'], 'manage_inspections');
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

        $requestModel = new ServiceRequest();
        if ($requestModel->inspectorHasConflict($inspectorId, $confirmedDate)) {
            $this->jsonResponse(['message' => 'You already have an inspection scheduled on that date.'], 409);
        }

        if (!$this->assignmentModel->claimWithDate($id, $inspectorId, $confirmedDate)) {
            $this->jsonResponse(['message' => 'Could not claim this inspection. It may already be taken.'], 409);
        }

        if (!empty($assignment['service_request_id'])) {
            $requestModel->scheduleInspection(
                $assignment['service_request_id'],
                $inspectorId,
                $inspectorId,
                $confirmedDate
            );
        }

        $this->jsonResponse([
            'message'    => 'Inspection assigned to you',
            'assignment' => $this->assignmentModel->findById($id),
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
        }

        $this->jsonResponse([
            'message'    => 'Inspection submitted. Awaiting client confirmation.',
            'assignment' => $this->assignmentModel->findById($id),
        ]);
    }
}
