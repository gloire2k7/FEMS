<?php

class LocationController extends Controller
{
    private $locationModel;

    public function __construct()
    {
        $this->locationModel = new Location();
    }

    private function requireClientId()
    {
        AuthMiddleware::check();
        if (($_SESSION['role_name'] ?? '') !== 'Company User') {
            $this->jsonResponse(['message' => 'Forbidden. Client access only.'], 403);
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
        $limit = min(5, max(1, (int) ($_GET['limit'] ?? 5)));
        $this->jsonResponse($this->locationModel->findPaginatedByClient($clientId, $page, $limit));
    }

    public function store()
    {
        $clientId = $this->requireClientId();
        $data = $this->getJsonInput();

        if (!$this->validateRequiredParams(['location_name'], $data)) {
            $this->jsonResponse(['message' => 'Location name is required.'], 400);
        }

        $payload = [
            'client_id'     => $clientId,
            'location_name' => trim($data['location_name']),
            'address'       => isset($data['address']) ? trim($data['address']) : null,
            'gps_lat'       => $data['gps_lat'] ?? null,
            'gps_lng'       => $data['gps_lng'] ?? null,
        ];

        $id = $this->locationModel->create($payload);
        if (!$id) {
            $this->jsonResponse(['message' => 'Failed to create location.'], 500);
        }

        $location = $this->locationModel->findByIdForClient($id, $clientId);
        $this->jsonResponse(['message' => 'Location created.', 'location' => $location], 201);
    }

    public function show($id)
    {
        $clientId = $this->requireClientId();
        $location = $this->locationModel->findByIdForClient($id, $clientId);
        if (!$location) {
            $this->jsonResponse(['message' => 'Location not found.'], 404);
        }

        $location['extinguishers'] = $this->locationModel->getExtinguishers($id);
        $this->jsonResponse($location);
    }

    public function availableUnits($id)
    {
        $clientId = $this->requireClientId();
        $location = $this->locationModel->findByIdForClient($id, $clientId);
        if (!$location) {
            $this->jsonResponse(['message' => 'Location not found.'], 404);
        }

        $page = max(1, (int) ($_GET['page'] ?? 1));
        $limit = min(5, max(1, (int) ($_GET['limit'] ?? 5)));
        $search = !empty($_GET['search']) ? trim($_GET['search']) : null;

        $this->jsonResponse(
            $this->locationModel->getUnassignedExtinguishersPaginated($clientId, $page, $limit, $search)
        );
    }

    public function destroy($id)
    {
        $clientId = $this->requireClientId();
        $location = $this->locationModel->findByIdForClient($id, $clientId);
        if (!$location) {
            $this->jsonResponse(['message' => 'Location not found.'], 404);
        }

        if ($this->locationModel->delete($id)) {
            $this->jsonResponse(['message' => 'Location deleted.']);
        }
        $this->jsonResponse(['message' => 'Failed to delete location.'], 500);
    }

    public function addUnits($id)
    {
        $clientId = $this->requireClientId();
        $location = $this->locationModel->findByIdForClient($id, $clientId);
        if (!$location) {
            $this->jsonResponse(['message' => 'Location not found.'], 404);
        }

        $data = $this->getJsonInput();
        $ids = $data['extinguisher_ids'] ?? [];
        if (!is_array($ids) || empty($ids)) {
            $this->jsonResponse(['message' => 'extinguisher_ids array is required.'], 400);
        }

        $result = $this->locationModel->addExtinguishers($id, $ids, $clientId);
        if (!$result['ok']) {
            $this->jsonResponse(['message' => $result['message']], 400);
        }
        $this->jsonResponse(['message' => 'Units added to location.', 'added' => $result['added']]);
    }

    public function removeUnits($id)
    {
        $clientId = $this->requireClientId();
        $location = $this->locationModel->findByIdForClient($id, $clientId);
        if (!$location) {
            $this->jsonResponse(['message' => 'Location not found.'], 404);
        }

        $data = $this->getJsonInput();
        $ids = $data['extinguisher_ids'] ?? [];
        if (!is_array($ids) || empty($ids)) {
            $this->jsonResponse(['message' => 'extinguisher_ids array is required.'], 400);
        }

        $result = $this->locationModel->removeExtinguishers($id, $ids, $clientId);
        if (!$result['ok']) {
            $this->jsonResponse(['message' => $result['message']], 400);
        }
        $this->jsonResponse(['message' => 'Units removed from location.', 'removed' => $result['removed']]);
    }
}
