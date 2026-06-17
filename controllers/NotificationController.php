<?php

require_once __DIR__ . '/../helpers/notification_helper.php';

class NotificationController extends Controller
{
    private $model;

    public function __construct()
    {
        $this->model = new Notification();
    }

    public function index()
    {
        AuthMiddleware::check();
        NotificationHelper::syncScheduledAlerts();
        $page = max(1, (int) ($_GET['page'] ?? 1));
        $limit = min(50, max(1, (int) ($_GET['limit'] ?? 20)));
        $this->jsonResponse($this->model->findByUserPaginated($_SESSION['user_id'], $page, $limit));
    }

    public function unreadCount()
    {
        AuthMiddleware::check();
        NotificationHelper::syncScheduledAlerts();
        $this->jsonResponse(['unread' => $this->model->unreadCount($_SESSION['user_id'])]);
    }

    public function markRead($id)
    {
        AuthMiddleware::check();
        $this->model->markRead($id, $_SESSION['user_id']);
        $this->jsonResponse(['message' => 'Marked as read', 'unread' => $this->model->unreadCount($_SESSION['user_id'])]);
    }

    public function markAllRead()
    {
        AuthMiddleware::check();
        $this->model->markAllRead($_SESSION['user_id']);
        $this->jsonResponse(['message' => 'All marked as read', 'unread' => 0]);
    }
}
