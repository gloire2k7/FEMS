<?php

class ClientController extends Controller
{
    private $clientModel;

    public function __construct()
    {
        $this->clientModel = new Client();
    }

    public function index()
    {
        AuthMiddleware::check(); // All logged in users can view clients
        $clients = $this->clientModel->findAll();
        $this->jsonResponse($clients);
    }

    public function store()
    {
        AuthMiddleware::hasRole(['Super Admin', 'Admin']);
        $data = $this->getJsonInput();

        if (!$this->validateRequiredParams(['company_name'], $data)) {
            $this->jsonResponse(["message" => "Company name is required"], 400);
        }

        $id = $this->clientModel->create($data);
        if ($id) {
            $this->jsonResponse(["message" => "Client created", "id" => $id], 201);
        }
        $this->jsonResponse(["message" => "Failed to create client"], 500);
    }

    public function show($id)
    {
        AuthMiddleware::check();
        $client = $this->clientModel->findById($id);
        if ($client) {
            $this->jsonResponse($client);
        }
        $this->jsonResponse(["message" => "Client not found"], 404);
    }

    public function update($id)
    {
        AuthMiddleware::hasRole(['Super Admin', 'Admin']);
        $data = $this->getJsonInput();

        if ($this->clientModel->update($id, $data)) {
            $this->jsonResponse(["message" => "Client updated successfully"]);
        }
        $this->jsonResponse(["message" => "Update failed"], 500);
    }

    public function destroy($id)
    {
        // Soft delete is recommended, but using physical delete here as per base model. 
        // Can be adjusted later if needed.
        AuthMiddleware::hasRole(['Super Admin']);
        if ($this->clientModel->delete($id)) {
            $this->jsonResponse(["message" => "Client deleted"]);
        }
        $this->jsonResponse(["message" => "Deletion failed"], 500);
    }
}
