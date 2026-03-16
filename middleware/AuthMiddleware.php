<?php

class AuthMiddleware
{
    /**
     * Check if user is logged in
     */
    public static function check()
    {
        if (!isset($_SESSION['user_id'])) {
            http_response_code(401);
            echo json_encode(["message" => "Unauthorized access. Please login."]);
            exit;
        }
    }

    /**
     * Check if user has specific role
     * @param string|array $roleNames
     */
    public static function hasRole($roleNames)
    {
        self::check();
        $userRole = isset($_SESSION['role_name']) ? $_SESSION['role_name'] : '';

        if (!is_array($roleNames)) {
            $roleNames = [$roleNames];
        }

        if (!in_array($userRole, $roleNames)) {
            http_response_code(403);
            echo json_encode(["message" => "Forbidden. You do not have the required permissions.", "role" => $userRole]);
            exit;
        }
    }
}
