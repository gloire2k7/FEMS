<?php

class Notification extends Model
{
    protected $table = 'notifications';

    public function create($data)
    {
        if (!empty($data['dedupe_key'])) {
            $existing = $this->findByDedupe($data['user_id'], $data['dedupe_key']);
            if ($existing) {
                return (int) $existing['id'];
            }
        }

        $stmt = $this->db->prepare(
            "INSERT INTO {$this->table}
            (user_id, title, type, message, link, entity_type, entity_id, dedupe_key, is_read)
            VALUES (:user_id, :title, :type, :message, :link, :entity_type, :entity_id, :dedupe_key, 0)"
        );
        $stmt->bindValue(':user_id', (int) $data['user_id'], PDO::PARAM_INT);
        $stmt->bindValue(':title', $data['title'] ?? 'Notification');
        $stmt->bindValue(':type', $data['type'] ?? 'info');
        $stmt->bindValue(':message', $data['message']);
        $stmt->bindValue(':link', $data['link'] ?? null);
        $stmt->bindValue(':entity_type', $data['entity_type'] ?? null);
        $entityId = $data['entity_id'] ?? null;
        $stmt->bindValue(':entity_id', $entityId, $entityId ? PDO::PARAM_INT : PDO::PARAM_NULL);
        $stmt->bindValue(':dedupe_key', $data['dedupe_key'] ?? null);
        return $stmt->execute() ? (int) $this->db->lastInsertId() : false;
    }

    public function findByDedupe($userId, $dedupeKey)
    {
        $stmt = $this->db->prepare(
            "SELECT * FROM {$this->table} WHERE user_id = :user_id AND dedupe_key = :dedupe_key LIMIT 1"
        );
        $stmt->bindValue(':user_id', (int) $userId, PDO::PARAM_INT);
        $stmt->bindValue(':dedupe_key', $dedupeKey);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function findByUserPaginated($userId, $page = 1, $limit = 20)
    {
        $offset = ($page - 1) * $limit;
        $userId = (int) $userId;

        $countStmt = $this->db->prepare("SELECT COUNT(*) FROM {$this->table} WHERE user_id = ?");
        $countStmt->execute([$userId]);
        $total = (int) $countStmt->fetchColumn();

        $stmt = $this->db->prepare(
            "SELECT * FROM {$this->table} WHERE user_id = :user_id ORDER BY is_read ASC, created_at DESC LIMIT :limit OFFSET :offset"
        );
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', (int) $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int) $offset, PDO::PARAM_INT);
        $stmt->execute();

        return [
            'data'      => $stmt->fetchAll(PDO::FETCH_ASSOC),
            'total'     => $total,
            'page'      => (int) $page,
            'last_page' => max(1, (int) ceil($total / $limit)),
            'unread'    => $this->unreadCount($userId),
        ];
    }

    public function unreadCount($userId)
    {
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM {$this->table} WHERE user_id = ? AND is_read = 0");
        $stmt->execute([(int) $userId]);
        return (int) $stmt->fetchColumn();
    }

    public function markRead($id, $userId)
    {
        $stmt = $this->db->prepare(
            "UPDATE {$this->table} SET is_read = 1 WHERE id = :id AND user_id = :user_id"
        );
        $stmt->bindValue(':id', (int) $id, PDO::PARAM_INT);
        $stmt->bindValue(':user_id', (int) $userId, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }

    public function markAllRead($userId)
    {
        $stmt = $this->db->prepare("UPDATE {$this->table} SET is_read = 1 WHERE user_id = ? AND is_read = 0");
        $stmt->execute([(int) $userId]);
        return $stmt->rowCount();
    }
}
