<?php

class AuthController extends Controller
{
    public function login()
    {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->jsonResponse(["message" => "Method not allowed"], 405);
        }

        $data = $this->getJsonInput();
        if (!$this->validateRequiredParams(['email', 'password'], $data)) {
            $this->jsonResponse(["message" => "Email and password are required"], 400);
        }

        $userModel = new User();
        $user = $userModel->findByEmail($data['email']);

        // Verify password hash
        if ($user && password_verify($data['password'], $user['password'])) {
            if ($user['status'] !== 'active') {
                $this->jsonResponse(["message" => "Account is inactive"], 403);
            }

            // Regenerate session ID to prevent session fixation attacks
            session_regenerate_id(true);

            // Fetch Role Name for RBAC
            $db = Database::getConnection();
            $stmt = $db->prepare("SELECT name FROM roles WHERE id = :role_id");
            $stmt->bindParam(':role_id', $user['role_id']);
            $stmt->execute();
            $role = $stmt->fetch(PDO::FETCH_ASSOC);

            $_SESSION['user_id'] = $user['id'];
            $_SESSION['role_id'] = $user['role_id'];
            $_SESSION['role_name'] = $role ? $role['name'] : '';
            $_SESSION['company_id'] = $user['company_id'];

            // Fetch Client Details if associated
            $clientData = null;
            if (!empty($user['company_id'])) {
                $stmt = $db->prepare("SELECT company_name, contact_person, phone, address FROM clients WHERE id = :id");
                $stmt->bindParam(':id', $user['company_id']);
                $stmt->execute();
                $clientData = $stmt->fetch(PDO::FETCH_ASSOC);
            }

            $_SESSION['user'] = [
                "id" => $user['id'],
                "name" => $user['name'],
                "email" => $user['email'],
                "role_name" => $_SESSION['role_name'],
                "company_id" => $user['company_id']
            ];

            $this->jsonResponse([
                "message" => "Login successful",
                "user" => [
                    "id" => $user['id'],
                    "name" => $user['name'],
                    "email" => $user['email'],
                    "role" => $_SESSION['role_name'],
                    "company_id" => $user['company_id'],
                    "company_name" => $clientData['company_name'] ?? null,
                    "contact_person" => $clientData['contact_person'] ?? null,
                    "phone" => $clientData['phone'] ?? null,
                    "address" => $clientData['address'] ?? null
                ]
            ]);
        }
        else {
            $this->jsonResponse(["message" => "Invalid credentials"], 401);
        }
    }

    public function logout()
    {
        AuthMiddleware::check();
        session_destroy();
        $this->jsonResponse(["message" => "Logout successful"]);
    }
}
