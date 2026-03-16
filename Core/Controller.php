<?php

class Controller
{

    /**
     * Send JSON Response
     * 
     * @param mixed $data Data to be encoded as JSON
     * @param int $statusCode HTTP Status Code (default 200)
     */
    protected function jsonResponse($data, $statusCode = 200)
    {
        http_response_code($statusCode);
        echo json_encode($data);
        exit;
    }

    /**
     * Get JSON Request Body Content
     * 
     * @return array|null Parsed JSON as associative array
     */
    protected function getJsonInput()
    {
        $json = file_get_contents('php://input');
        return json_decode($json, true);
    }

    /**
     * Helper to check if array keys exist
     * 
     * @param array $keys Required keys
     * @param array $array Array to check
     * @return bool
     */
    protected function validateRequiredParams($keys, $array)
    {
        foreach ($keys as $key) {
            if (!isset($array[$key]) || (is_string($array[$key]) && trim($array[$key]) === '')) {
                return false;
            }
        }
        return true;
    }
}
