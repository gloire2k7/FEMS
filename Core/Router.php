<?php

class Router
{
    private $routes = [];

    public function get($path, $callback)
    {
        $this->addRoute('GET', $path, $callback);
    }

    public function post($path, $callback)
    {
        $this->addRoute('POST', $path, $callback);
    }

    public function put($path, $callback)
    {
        $this->addRoute('PUT', $path, $callback);
    }

    public function delete($path, $callback)
    {
        $this->addRoute('DELETE', $path, $callback);
    }

    private function addRoute($method, $path, $callback)
    {
        // Convert route params {id} to regex
        $pathRegex = preg_replace('/\{([a-zA-Z0-9_]+)\}/', '([^/]+)', $path);
        $this->routes[] = [
            'method' => $method,
            'path' => '#^' . $pathRegex . '$#',
            'callback' => $callback
        ];
    }

    public function dispatch($method, $uri)
    {
        // Remove query string from URI
        if (($pos = strpos($uri, '?')) !== false) {
            $uri = substr($uri, 0, $pos);
        }

        // Standardize URI (remove duplicate slashes and trail slashes except root)
        $uri = rtrim($uri, '/');
        if (empty($uri)) {
            $uri = '/';
        }

        foreach ($this->routes as $route) {
            if ($route['method'] === $method && preg_match($route['path'], $uri, $matches)) {
                array_shift($matches); // Remove the full match

                // Call the callback
                if (is_callable($route['callback']) && !is_array($route['callback'])) {
                    call_user_func_array($route['callback'], $matches);
                }
                elseif (is_array($route['callback']) && count($route['callback']) === 2) {
                    $controllerName = $route['callback'][0];
                    $actionName = $route['callback'][1];

                    if (class_exists($controllerName)) {
                        $controller = new $controllerName();
                        if (method_exists($controller, $actionName)) {
                            call_user_func_array([$controller, $actionName], $matches);
                        }
                        else {
                            $this->sendNotFound("Method not found.");
                        }
                    }
                    else {
                        $this->sendNotFound("Controller not found.");
                    }
                }
                return;
            }
        }

        $this->sendNotFound("Route not found.");
    }

    private function sendNotFound($message)
    {
        http_response_code(404);
        echo json_encode(["message" => $message]);
    }
}
