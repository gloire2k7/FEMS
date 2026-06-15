<?php

class AuthMiddleware
{
    public static function check()
    {
        if (!isset($_SESSION['user_id'])) {
            http_response_code(401);
            echo json_encode(["message" => "Unauthorized access. Please login."]);
            exit;
        }
    }

    public static function hasRole($roleNames)
    {
        self::check();
        $userRole = $_SESSION['role_name'] ?? '';

        if (!is_array($roleNames)) {
            $roleNames = [$roleNames];
        }

        if (!in_array($userRole, $roleNames)) {
            http_response_code(403);
            echo json_encode(["message" => "Forbidden. You do not have the required role.", "role" => $userRole]);
            exit;
        }
    }

    /** Super Admin bypasses all permission checks. */
    public static function hasPermission($permissionKey)
    {
        self::check();
        if (($_SESSION['role_name'] ?? '') === 'Super Admin') {
            return;
        }
        $perms = $_SESSION['permissions'] ?? [];
        if (!in_array($permissionKey, $perms, true)) {
            http_response_code(403);
            echo json_encode(["message" => "Forbidden. Missing permission: $permissionKey"]);
            exit;
        }
    }

    public static function hasRoleOrPermission(array $roles, $permissionKey)
    {
        self::check();
        if (in_array($_SESSION['role_name'] ?? '', $roles, true)) {
            return;
        }
        self::hasPermission($permissionKey);
    }

    public static function refreshPermissions($userId)
    {
        $permModel = new Permission();
        $_SESSION['permissions'] = $permModel->getUserPermissions($userId);
    }
}
