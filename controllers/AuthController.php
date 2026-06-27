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
            if (isset($user['email_verified']) && (int) $user['email_verified'] === 0) {
                $this->jsonResponse(["message" => "Please verify your email to finish registering. Check your inbox for the verification code."], 403);
            }
            if ($user['status'] === 'pending') {
                $this->jsonResponse(["message" => "Your registration is pending approval. You will receive an email once approved."], 403);
            }

            session_regenerate_id(true);

            // Permission-driven for everyone, including Super Admin. A Super Admin
            // is seeded with every permission at setup but can revoke their own,
            // so we always read the stored set rather than overriding it here.
            $permModel = new Permission();
            $permissions = $permModel->getUserPermissions($user['id']);

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

    /**
     * Public client self-registration. No password is set here; the client
     * receives an email-verification OTP. After verifying and admin approval,
     * an auto-generated password is emailed to them.
     */
    public function registerClient()
    {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->jsonResponse(["message" => "Method not allowed"], 405);
        }

        require_once __DIR__ . '/../helpers/mail_helper.php';
        require_once __DIR__ . '/../helpers/audit_helper.php';

        $data = $this->getJsonInput();
        if (!$this->validateRequiredParams(['name', 'email', 'company_name', 'phone', 'address'], $data)) {
            $this->jsonResponse(["message" => "All fields are required."], 400);
        }

        $email = trim($data['email']);
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->jsonResponse(["message" => "Invalid email format"], 400);
        }

        $userModel = new User();
        $existing = $userModel->findByEmail($email);
        $clientModel = new Client();

        if ($existing) {
            // Allow resuming an unfinished registration (created but email never verified).
            if ($existing['role_name'] === 'Company User' && (int) $existing['email_verified'] === 0) {
                if (!empty($existing['company_id'])) {
                    $clientModel->update((int) $existing['company_id'], [
                        'company_name' => $data['company_name'],
                        'contact_person' => $data['name'],
                        'phone' => $data['phone'],
                        'email' => $email,
                        'address' => $data['address'],
                        'gps_lat' => null,
                        'gps_lng' => null,
                        'delivery_instructions' => null,
                    ]);
                }
                $userModel->update((int) $existing['id'], ['name' => $data['name']]);

                $tokenModel = new EmailVerificationToken();
                $otp = $tokenModel->createForUser((int) $existing['id']);
                MailHelper::sendClientVerificationOtp($email, $data['name'], $otp);

                $this->jsonResponse([
                    'message' => 'We sent a new verification code to your email. Enter it to continue.',
                    'email' => $email,
                ], 201);
            }

            $this->jsonResponse(["message" => "An account with that email already exists."], 409);
        }

        $roleId = $this->companyUserRoleId();
        if (!$roleId) {
            $this->jsonResponse(["message" => "Registration is not available right now."], 500);
        }

        $clientId = $clientModel->create([
            'company_name' => $data['company_name'],
            'contact_person' => $data['name'],
            'phone' => $data['phone'],
            'email' => $email,
            'address' => $data['address'],
        ]);
        if (!$clientId) {
            $this->jsonResponse(["message" => "Failed to create company profile"], 500);
        }

        $userId = $userModel->create([
            'name' => $data['name'],
            'email' => $email,
            // Placeholder password the client never knows; real one is emailed after approval.
            'password' => bin2hex(random_bytes(16)),
            'role_id' => $roleId,
            'company_id' => $clientId,
            'status' => 'pending',
            'email_verified' => 0,
        ]);
        if (!$userId) {
            $this->jsonResponse(["message" => "Failed to create account"], 500);
        }

        // Grant the default client permission bundle (Super Admin can tweak later).
        (new Permission())->applyRoleDefaults((int) $userId, 'Company User');

        $tokenModel = new EmailVerificationToken();
        $otp = $tokenModel->createForUser((int) $userId);
        MailHelper::sendClientVerificationOtp($email, $data['name'], $otp);

        AuditHelper::log('create', 'client', (int) $userId, $data['company_name'], "Registration started, awaiting email verification ({$email})", (int) $userId);

        $this->jsonResponse([
            'message' => 'We sent a verification code to your email. Enter it to continue.',
            'email' => $email,
        ], 201);
    }

    /**
     * Verify the registration OTP. On success the email is confirmed and the
     * registration moves into the admin approval queue.
     */
    public function verifyRegistrationOtp()
    {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->jsonResponse(["message" => "Method not allowed"], 405);
        }

        require_once __DIR__ . '/../helpers/notification_helper.php';
        require_once __DIR__ . '/../helpers/audit_helper.php';

        $data = $this->getJsonInput();
        if (!$this->validateRequiredParams(['email', 'otp'], $data)) {
            $this->jsonResponse(["message" => "Email and verification code are required"], 400);
        }

        $email = trim($data['email']);
        $otp = preg_replace('/\D/', '', trim($data['otp'] ?? ''));
        if (strlen($otp) !== 6) {
            $this->jsonResponse(["message" => "Enter the 6-digit verification code"], 400);
        }

        $userModel = new User();
        $user = $userModel->findByEmail($email);
        if (!$user || $user['role_name'] !== 'Company User') {
            $this->jsonResponse(["message" => "Invalid or expired verification code. Request a new one."], 400);
        }
        if ((int) $user['email_verified'] === 1) {
            $this->jsonResponse(['message' => 'Your email is already verified. An administrator will review your account.']);
        }

        $tokenModel = new EmailVerificationToken();
        $record = $tokenModel->findValidForUser((int) $user['id'], $otp);
        if (!$record) {
            $this->jsonResponse(["message" => "Invalid or expired verification code. Request a new one."], 400);
        }

        $userModel->markEmailVerified((int) $user['id']);
        $tokenModel->markUsed((int) $record['id']);
        $tokenModel->invalidateForUser((int) $user['id']);

        $company = $user['company_name'] ?? $user['name'];
        NotificationHelper::notifyByPermission('clients.view', 'info', 'New client registration',
            "{$user['name']} ({$email}) verified their email and is awaiting approval.",
            '/clients?tab=pending', 'user', (int) $user['id'], "client_pending:{$user['id']}");
        AuditHelper::log('create', 'client', (int) $user['id'], $company, "Email verified, awaiting approval ({$email})", (int) $user['id']);

        $this->jsonResponse([
            'message' => 'Email verified! An administrator will review your account. You will receive your sign-in details by email once approved.',
        ]);
    }

    /**
     * Resend a registration verification OTP.
     */
    public function resendRegistrationOtp()
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
        $userModel = new User();
        $user = $userModel->findByEmail($email);

        if ($user && $user['role_name'] === 'Company User' && (int) $user['email_verified'] === 0) {
            $tokenModel = new EmailVerificationToken();
            $otp = $tokenModel->createForUser((int) $user['id']);
            MailHelper::sendClientVerificationOtp($user['email'], $user['name'], $otp);
        }

        $this->jsonResponse([
            'message' => 'If your registration is awaiting verification, we sent a new code.',
        ]);
    }

    private function companyUserRoleId(): ?int
    {
        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT id FROM roles WHERE name = 'Company User' LIMIT 1");
        $stmt->execute();
        $id = $stmt->fetchColumn();
        return $id ? (int) $id : null;
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
