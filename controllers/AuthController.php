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

        if ($user && password_verify($data['password'], $user['password'])) {
            if ($user['status'] === 'inactive') {
                $this->jsonResponse(["message" => "Your account has been deactivated. Contact support."], 403);
            }
            if ($user['status'] === 'pending') {
                $this->jsonResponse(["message" => "Your registration is pending approval. You will receive an email once approved."], 403);
            }

            session_regenerate_id(true);

            $permModel = new Permission();
            $permissions = ($user['role_name'] === 'Super Admin')
                ? array_column($permModel->findAllKeys(), 'key')
                : $permModel->getUserPermissions($user['id']);

            $_SESSION['user_id'] = $user['id'];
            $_SESSION['role_id'] = $user['role_id'];
            $_SESSION['role_name'] = $user['role_name'] ?? '';
            $_SESSION['company_id'] = $user['company_id'];
            $_SESSION['permissions'] = $permissions;

            $clientData = null;
            if (!empty($user['company_id'])) {
                $db = Database::getConnection();
                $stmt = $db->prepare("SELECT company_name, contact_person, phone, address FROM clients WHERE id = :id");
                $stmt->bindParam(':id', $user['company_id']);
                $stmt->execute();
                $clientData = $stmt->fetch(PDO::FETCH_ASSOC);
            }

            $_SESSION['user'] = [
                'id' => $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'role_name' => $_SESSION['role_name'],
                'company_id' => $user['company_id'],
            ];

            $this->jsonResponse([
                'message' => 'Login successful',
                'user' => [
                    'id' => $user['id'],
                    'name' => $user['name'],
                    'email' => $user['email'],
                    'role' => $_SESSION['role_name'],
                    'company_id' => $user['company_id'],
                    'permissions' => $permissions,
                    'must_change_password' => (bool) ($user['must_change_password'] ?? false),
                    'company_name' => $clientData['company_name'] ?? null,
                    'contact_person' => $clientData['contact_person'] ?? null,
                    'phone' => $clientData['phone'] ?? null,
                    'address' => $clientData['address'] ?? null,
                ],
            ]);
        }

        $this->jsonResponse(["message" => "Invalid credentials"], 401);
    }

    public function me()
    {
        AuthMiddleware::check();
        $userModel = new User();
        $user = $userModel->findById($_SESSION['user_id']);
        if (!$user) {
            $this->jsonResponse(["message" => "User not found"], 404);
        }
        unset($user['password']);
        AuthMiddleware::refreshPermissions($user['id']);
        $user['permissions'] = $_SESSION['permissions'];
        $user['role'] = $user['role_name'];
        $this->jsonResponse($user);
    }

    public function logout()
    {
        AuthMiddleware::check();
        session_destroy();
        $this->jsonResponse(["message" => "Logout successful"]);
    }

    public function forgotPassword()
    {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->jsonResponse(["message" => "Method not allowed"], 405);
        }

        require_once __DIR__ . '/../helpers/mail_helper.php';

        $data = $this->getJsonInput();
        if (!$this->validateRequiredParams(['email'], $data)) {
            $this->jsonResponse(["message" => "Email is required"], 400);
        }

        $email = trim($data['email']);
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->jsonResponse(["message" => "Invalid email format"], 400);
        }

        $userModel = new User();
        $user = $userModel->findByEmail($email);

        if ($user && $user['status'] === 'active') {
            $tokenModel = new PasswordResetToken();
            $otp = $tokenModel->createOtpForUser((int) $user['id']);
            MailHelper::sendPasswordResetOtp($user['email'], $user['name'], $otp);
        }

        $this->jsonResponse([
            'message' => 'If an account exists with that email, we sent a verification code.',
        ]);
    }

    public function resetPassword()
    {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->jsonResponse(["message" => "Method not allowed"], 405);
        }

        $data = $this->getJsonInput();
        if (!$this->validateRequiredParams(['email', 'otp', 'password', 'password_confirmation'], $data)) {
            $this->jsonResponse(["message" => "Email, verification code, and new password are required"], 400);
        }

        $email = trim($data['email']);
        $otp = preg_replace('/\D/', '', trim($data['otp'] ?? ''));
        $password = $data['password'];
        $confirm = $data['password_confirmation'];

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->jsonResponse(["message" => "Invalid email format"], 400);
        }
        if (strlen($otp) !== 6) {
            $this->jsonResponse(["message" => "Enter the 6-digit verification code"], 400);
        }
        if (strlen($password) < 8) {
            $this->jsonResponse(["message" => "Password must be at least 8 characters"], 400);
        }
        if ($password !== $confirm) {
            $this->jsonResponse(["message" => "Passwords do not match"], 400);
        }

        $tokenModel = new PasswordResetToken();
        $record = $tokenModel->findValidByEmailAndOtp($email, $otp);
        if (!$record) {
            $this->jsonResponse(["message" => "Invalid or expired verification code. Request a new one."], 400);
        }

        $userModel = new User();
        if (!$userModel->setPassword((int) $record['user_id'], $password)) {
            $this->jsonResponse(["message" => "Could not update password"], 500);
        }

        $tokenModel->markUsed((int) $record['id']);
        $tokenModel->invalidateForUser((int) $record['user_id']);

        $this->jsonResponse(['message' => 'Your password has been reset. You can now sign in.']);
    }
}
