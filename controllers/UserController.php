<?php

class UserController extends Controller
{
    private $userModel;

    public function __construct()
    {
        $this->userModel = new User();
    }

    public function index()
    {
        AuthMiddleware::hasRole(['Super Admin', 'Admin']);
        $users = $this->userModel->findAll();
        // Remove sensitive data (passwords) from output
        foreach ($users as &$user) {
            unset($user['password']);
        }
        $this->jsonResponse($users);
    }

    public function store()
    {
        $data = $this->getJsonInput();

        if (!$this->validateRequiredParams(['name', 'email', 'role_id'], $data)) {
            $this->jsonResponse(["message" => "Missing required fields: name, email, role_id"], 400);
        }

        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            $this->jsonResponse(["message" => "Invalid email format"], 400);
        }

        if ($this->userModel->findByEmail($data['email'])) {
            $this->jsonResponse(["message" => "Email already exists"], 409);
        }

        // Get role details
        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT name FROM roles WHERE id = :id");
        $stmt->bindParam(':id', $data['role_id']);
        $stmt->execute();
        $role = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$role) {
            $this->jsonResponse(["message" => "Invalid role ID"], 400);
        }

        // 1. Company User self-signup
        if ($role['name'] === 'Company User') {
            if (!$this->validateRequiredParams(['password', 'company_name', 'phone', 'address'], $data)) {
                $this->jsonResponse(["message" => "Missing required fields for Company User signup: password, company_name, phone, address"], 400);
            }

            // Create Client Profile First
            $clientModel = new Client();
            $clientData = [
                'company_name' => $data['company_name'],
                'contact_person' => isset($data['name']) ? $data['name'] : null,
                'phone' => $data['phone'],
                'email' => $data['email'],
                'address' => $data['address'],
                'gps_lat' => isset($data['gps_lat']) ? $data['gps_lat'] : null,
                'gps_lng' => isset($data['gps_lng']) ? $data['gps_lng'] : null,
                'delivery_instructions' => isset($data['delivery_instructions']) ? $data['delivery_instructions'] : null,
            ];

            $clientId = $clientModel->create($clientData);
            if (!$clientId) {
                $this->jsonResponse(["message" => "Failed to create Client profile during registration"], 500);
            }

            // Link newly created client ID to the user as their primary company_id
            $data['company_id'] = $clientId;
        }
        // 2. Admin creation by Super Admin
        else if ($role['name'] === 'Admin') {
            AuthMiddleware::hasRole(['Super Admin']); // Only Super Admin can create Admin

            // Auto-generate a secure random password for the Admin
            $generatedPassword = bin2hex(random_bytes(6)); // 12 character password
            $data['password'] = $generatedPassword;
        }
        // 3. Super Admin creation
        else if ($role['name'] === 'Super Admin') {
            $this->jsonResponse(["message" => "Cannot create Super Admin via this endpoint."], 403);
        }

        $id = $this->userModel->create($data);
        if ($id) {
            $response = ["message" => "User created successfully", "id" => $id];

            // If Admin was created, return the plain text password once so Super Admin can secure it
            if ($role['name'] === 'Admin') {
                $response['generated_password'] = $data['password'];
            }

            $this->jsonResponse($response, 201);
        }
        $this->jsonResponse(["message" => "Failed to create user"], 500);
    }

    public function show($id)
    {
        AuthMiddleware::check();
        $user = $this->userModel->findById($id);
        if ($user) {
            unset($user['password']);
            $this->jsonResponse($user);
        }
        $this->jsonResponse(["message" => "User not found"], 404);
    }

    public function update($id)
    {
        AuthMiddleware::hasRole(['Super Admin', 'Admin']);
        $data = $this->getJsonInput();

        // Prevent changing password through update method directly; maybe a separate method
        if ($this->userModel->update($id, $data)) {
            $this->jsonResponse(["message" => "User updated successfully"]);
        }
        $this->jsonResponse(["message" => "Update failed"], 500);
    }

    public function changePassword()
    {
        AuthMiddleware::check(); // must be logged in
        $data = $this->getJsonInput();

        if (!$this->validateRequiredParams(['current_password', 'new_password'], $data)) {
            $this->jsonResponse(["message" => "Current and new passwords are required"], 400);
        }

        $userId = $_SESSION['user_id'];
        $user = $this->userModel->findById($userId);

        if (!password_verify($data['current_password'], $user['password'])) {
            $this->jsonResponse(["message" => "Incorrect current password"], 401);
        }

        $db = Database::getConnection();
        $query = "UPDATE users SET password = :password WHERE id = :id";
        $stmt = $db->prepare($query);
        $hashedPassword = password_hash($data['new_password'], PASSWORD_DEFAULT);
        $stmt->bindParam(':password', $hashedPassword);
        $stmt->bindParam(':id', $userId);

        if ($stmt->execute()) {
            $this->jsonResponse(["message" => "Password updated successfully"]);
        }
        $this->jsonResponse(["message" => "Failed to update password"], 500);
    }

    public function destroy($id)
    {
        AuthMiddleware::hasRole(['Super Admin']);
        if ($this->userModel->delete($id)) {
            $this->jsonResponse(["message" => "User deleted"]);
        }
        $this->jsonResponse(["message" => "Deletion failed"], 500);
    }
}
