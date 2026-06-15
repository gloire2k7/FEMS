<?php

require_once __DIR__ . '/../helpers/mail_helper.php';

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
        foreach ($users as &$user) {
            unset($user['password']);
        }
        $this->jsonResponse($users);
    }

    public function admins()
    {
        AuthMiddleware::hasRole(['Super Admin']);
        $page = max(1, (int) ($_GET['page'] ?? 1));
        $limit = min(50, max(5, (int) ($_GET['limit'] ?? 10)));
        $result = $this->userModel->findAdminsPaginated($page, $limit);

        $permModel = new Permission();
        foreach ($result['data'] as &$admin) {
            $admin['permissions'] = $permModel->getUserPermissions($admin['id']);
        }
        $this->jsonResponse($result);
    }

    public function pendingClients()
    {
        AuthMiddleware::hasRoleOrPermission(['Super Admin'], 'approve_clients');
        $page = max(1, (int) ($_GET['page'] ?? 1));
        $this->jsonResponse($this->userModel->findPendingClients($page, 10));
    }

    public function clients()
    {
        AuthMiddleware::hasRoleOrPermission(['Super Admin', 'Admin'], 'approve_clients');
        $page = max(1, (int) ($_GET['page'] ?? 1));
        $status = $_GET['status'] ?? null;
        $this->jsonResponse($this->userModel->findClientsPaginated($page, 10, $status));
    }

    public function permissions()
    {
        AuthMiddleware::hasRole(['Super Admin']);
        $permModel = new Permission();
        $this->jsonResponse($permModel->findAllKeys());
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

        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT name FROM roles WHERE id = :id");
        $stmt->bindParam(':id', $data['role_id']);
        $stmt->execute();
        $role = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$role) {
            $this->jsonResponse(["message" => "Invalid role ID"], 400);
        }

        $plainPassword = null;

        if ($role['name'] === 'Company User') {
            if (!$this->validateRequiredParams(['password', 'company_name', 'phone', 'address'], $data)) {
                $this->jsonResponse(["message" => "Missing required fields for registration"], 400);
            }

            $clientModel = new Client();
            $clientId = $clientModel->create([
                'company_name' => $data['company_name'],
                'contact_person' => $data['name'],
                'phone' => $data['phone'],
                'email' => $data['email'],
                'address' => $data['address'],
            ]);
            if (!$clientId) {
                $this->jsonResponse(["message" => "Failed to create company profile"], 500);
            }
            $data['company_id'] = $clientId;
            $data['status'] = 'pending';
        } elseif ($role['name'] === 'Admin') {
            AuthMiddleware::hasRole(['Super Admin']);
            $plainPassword = bin2hex(random_bytes(6));
            $data['password'] = $plainPassword;
            $data['status'] = 'active';
        } elseif ($role['name'] === 'Super Admin') {
            $this->jsonResponse(["message" => "Cannot create Super Admin via this endpoint."], 403);
        }

        $id = $this->userModel->create($data);
        if (!$id) {
            $this->jsonResponse(["message" => "Failed to create user"], 500);
        }

        if ($role['name'] === 'Admin') {
            $permKeys = $data['permissions'] ?? [];
            (new Permission())->setUserPermissions($id, $permKeys);
            MailHelper::sendAdminCredentials($data['email'], $data['name'], $plainPassword);
            $this->jsonResponse([
                'message' => 'Admin created. Credentials sent by email.',
                'id' => $id,
                'generated_password' => $plainPassword,
            ], 201);
        }

        if ($role['name'] === 'Company User') {
            $this->jsonResponse([
                'message' => 'Registration submitted. Await admin approval before signing in.',
                'id' => $id,
                'status' => 'pending',
            ], 201);
        }

        $this->jsonResponse(['message' => 'User created successfully', 'id' => $id], 201);
    }

    public function show($id)
    {
        AuthMiddleware::check();
        $user = $this->userModel->findById($id);
        if (!$user) {
            $this->jsonResponse(["message" => "User not found"], 404);
        }
        unset($user['password']);
        $user['permissions'] = (new Permission())->getUserPermissions($id);
        $this->jsonResponse($user);
    }

    public function update($id)
    {
        AuthMiddleware::hasRole(['Super Admin']);
        $data = $this->getJsonInput();

        if ($this->userModel->update($id, $data)) {
            if (isset($data['permissions'])) {
                (new Permission())->setUserPermissions($id, $data['permissions']);
            }
            $this->jsonResponse(['message' => 'User updated successfully']);
        }
        $this->jsonResponse(["message" => "Update failed"], 500);
    }

    public function setStatus($id)
    {
        AuthMiddleware::hasRoleOrPermission(['Super Admin'], 'manage_admins');
        $data = $this->getJsonInput();
        $status = $data['status'] ?? '';
        if (!in_array($status, ['active', 'inactive'], true)) {
            $this->jsonResponse(["message" => "Invalid status"], 400);
        }
        $user = $this->userModel->findById($id);
        if (!$user || $user['role_name'] !== 'Admin') {
            $this->jsonResponse(["message" => "Admin not found"], 404);
        }
        $this->userModel->setStatus($id, $status);
        $this->jsonResponse(['message' => "Admin {$status}"]);
    }

    public function approveClient($id)
    {
        AuthMiddleware::hasRoleOrPermission(['Super Admin', 'Admin'], 'approve_clients');
        $user = $this->userModel->findById($id);
        if (!$user || $user['role_name'] !== 'Company User') {
            $this->jsonResponse(["message" => "Client not found"], 404);
        }
        $this->userModel->setStatus($id, 'active');
        MailHelper::sendClientApproval($user['email'], $user['name'], true);
        $this->jsonResponse(['message' => 'Client approved']);
    }

    public function rejectClient($id)
    {
        AuthMiddleware::hasRoleOrPermission(['Super Admin', 'Admin'], 'approve_clients');
        $user = $this->userModel->findById($id);
        if (!$user || $user['role_name'] !== 'Company User') {
            $this->jsonResponse(["message" => "Client not found"], 404);
        }
        $this->userModel->setStatus($id, 'inactive');
        MailHelper::sendClientApproval($user['email'], $user['name'], false);
        $this->jsonResponse(['message' => 'Client rejected']);
    }

    public function changePassword()
    {
        AuthMiddleware::check();
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
        $hash = password_hash($data['new_password'], PASSWORD_DEFAULT);
        $db->prepare("UPDATE users SET password = ? WHERE id = ?")->execute([$hash, $userId]);
        $this->jsonResponse(['message' => 'Password updated successfully']);
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
