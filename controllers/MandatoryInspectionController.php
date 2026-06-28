<?php

require_once __DIR__ . '/../helpers/notification_helper.php';

class MandatoryInspectionController extends Controller
{
    private $typeModel;
    private $assignmentModel;
    private $instanceModel;
    private $requestModel;

    public function __construct()
    {
        $this->typeModel = new MandatoryInspectionType();
        $this->assignmentModel = new MandatoryClientAssignment();
        $this->instanceModel = new MandatoryInspectionInstance();
        $this->requestModel = new ServiceRequest();
    }

    public function indexTypes()
    {
        AuthMiddleware::hasPermission('mandatory.manage');
        $this->jsonResponse($this->typeModel->findAll());
    }

    public function storeType()
    {
        AuthMiddleware::hasPermission('mandatory.manage');
        $data = $this->getJsonInput();
        if (!$this->validateRequiredParams(['name', 'interval_months'], $data)) {
            $this->jsonResponse(['message' => 'Name and interval are required.'], 400);
        }
        $id = $this->typeModel->create($data);
        if (!$id) {
            $this->jsonResponse(['message' => 'Failed to create mandatory inspection.'], 500);
        }
        $this->jsonResponse(['message' => 'Mandatory inspection created.', 'type' => $this->typeModel->findById($id)], 201);
    }

    public function updateType($id)
    {
        AuthMiddleware::hasPermission('mandatory.manage');
        $data = $this->getJsonInput();
        if (!$this->typeModel->update($id, $data)) {
            $this->jsonResponse(['message' => 'Update failed.'], 400);
        }
        $this->jsonResponse(['message' => 'Updated.', 'type' => $this->typeModel->findById($id)]);
    }

    public function destroyType($id)
    {
        AuthMiddleware::hasPermission('mandatory.manage');
        if (!$this->typeModel->delete($id)) {
            $this->jsonResponse(['message' => 'Delete failed.'], 400);
        }
        $this->jsonResponse(['message' => 'Deleted.']);
    }

    public function indexAssignments()
    {
        AuthMiddleware::hasPermission('mandatory.manage');
        $this->jsonResponse($this->assignmentModel->findAllWithDetails());
    }

    public function storeAssignment()
    {
        AuthMiddleware::hasPermission('mandatory.manage');
        $data = $this->getJsonInput();
        if (!$this->validateRequiredParams(['mandatory_type_id', 'client_id', 'inspector_id'], $data)) {
            $this->jsonResponse(['message' => 'Type, client, and inspector are required.'], 400);
        }

        $userModel = new User();
        $inspector = $userModel->findById((int) $data['inspector_id']);
        if (!$inspector || $inspector['role_name'] !== 'Inspector' || $inspector['status'] !== 'active') {
            $this->jsonResponse(['message' => 'Invalid inspector.'], 400);
        }

        $assignmentId = $this->assignmentModel->upsert(
            (int) $data['mandatory_type_id'],
            (int) $data['client_id'],
            (int) $data['inspector_id']
        );
        if (!$assignmentId) {
            $this->jsonResponse(['message' => 'Failed to assign.'], 500);
        }

        $assignment = $this->assignmentModel->findById($assignmentId);
        if (!$this->instanceModel->hasActiveForAssignment($assignmentId)) {
            $this->createInitialInstance($assignment);
        }

        $emailSent = NotificationHelper::sendMandatoryAssignmentEmails($assignment);

        NotificationHelper::notifyInspector(
            (int) $assignment['inspector_id'],
            'info',
            'Mandatory inspection assigned',
            "You are responsible for \"{$assignment['mandatory_name']}\" at {$assignment['company_name']}.",
            '/inspector-mandatory-inspections',
            'mandatory_assignment',
            (int) $assignmentId,
            "mandatory_assign:{$assignmentId}"
        );
        NotificationHelper::notifyCompanyUsers(
            (int) $assignment['client_id'],
            'info',
            'Mandatory inspection inspector assigned',
            "{$assignment['inspector_name']} is your inspector for \"{$assignment['mandatory_name']}\".",
            '/service-requests?type=mandatory',
            'mandatory_assignment',
            (int) $assignmentId,
            "mandatory_assign_client:{$assignmentId}"
        );

        $this->jsonResponse([
            'message'    => $emailSent
                ? 'Assignment saved. Email and in-app notifications sent.'
                : 'Assignment saved. In-app notifications sent (email could not be delivered — check addresses).',
            'assignment' => $assignment,
            'email_sent' => $emailSent,
        ], 201);
    }

    public function destroyAssignment($id)
    {
        AuthMiddleware::hasPermission('mandatory.manage');
        if (!$this->assignmentModel->delete($id)) {
            $this->jsonResponse(['message' => 'Delete failed.'], 400);
        }
        $this->jsonResponse(['message' => 'Assignment removed.']);
    }

    public function inspectorIndex()
    {
        AuthMiddleware::check();
        if (($_SESSION['role_name'] ?? '') !== 'Inspector') {
            $this->jsonResponse(['message' => 'Forbidden'], 403);
        }
        $page = max(1, (int) ($_GET['page'] ?? 1));
        $limit = min(5, max(1, (int) ($_GET['limit'] ?? 5)));
        $this->jsonResponse($this->instanceModel->findByInspectorPaginated($_SESSION['user_id'], $page, $limit));
    }

    public function inspectorComplete($id)
    {
        AuthMiddleware::check();
        if (($_SESSION['role_name'] ?? '') !== 'Inspector') {
            $this->jsonResponse(['message' => 'Forbidden'], 403);
        }
        $data = $this->getJsonInput();
        if (!$this->validateRequiredParams(['result_status'], $data)) {
            $this->jsonResponse(['message' => 'Result is required.'], 400);
        }
        if (!$this->instanceModel->complete($id, $_SESSION['user_id'], $data)) {
            $this->jsonResponse(['message' => 'Could not complete.'], 400);
        }
        $instance = $this->instanceModel->findById($id);
        $this->requestModel->markMandatoryAwaitingClient($id);
        $req = $this->requestModel->findByMandatoryInstanceId($id);
        if ($req) {
            $this->requestModel->markAwaitingClient($req['id'], [
                'inspector_notes' => $data['notes'] ?? null,
                'result_status'   => $data['result_status'],
            ]);
        }
        $this->jsonResponse(['message' => 'Submitted. Awaiting client confirmation.', 'instance' => $instance]);
    }

    private function createInitialInstance(array $assignment)
    {
        $due = new DateTime('now');
        $due->modify('+' . (int) $assignment['interval_months'] . ' months');
        $deadline = clone $due;
        $deadline->modify('+' . (int) $assignment['deadline_days'] . ' days');
        $instanceId = $this->instanceModel->create(
            (int) $assignment['id'],
            $due->format('Y-m-d'),
            $deadline->format('Y-m-d')
        );
        if ($instanceId) {
            $reqId = $this->requestModel->createMandatoryPlaceholder(
                (int) $assignment['client_id'],
                $instanceId,
                $due->format('Y-m-d'),
                'Mandatory: ' . $assignment['mandatory_name']
            );
            if ($reqId) {
                $db = Database::getConnection();
                $db->prepare("UPDATE service_requests SET status = 'scheduled' WHERE id = ?")->execute([(int) $reqId]);
            }
        }
    }
}
