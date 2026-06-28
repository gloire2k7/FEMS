<?php

class AuditLog extends Model
{
    protected $table = 'audit_logs';

    /** Entity types hidden from the super-admin activity log UI */
    private const EXCLUDED_ENTITY_TYPES = ['auth'];

    private static function baseWhere(): string
    {
        return "a.entity_type NOT IN ('" . implode("','", self::EXCLUDED_ENTITY_TYPES) . "')";
    }

    public function create($data)
    {
        $stmt = $this->db->prepare(
            "INSERT INTO {$this->table}
            (user_id, action, entity_type, entity_id, entity_label, details, ip_address)
            VALUES (:user_id, :action, :entity_type, :entity_id, :entity_label, :details, :ip_address)"
        );
        $userId = $data['user_id'] ?? null;
        $entityId = $data['entity_id'] ?? null;
        $stmt->bindValue(':user_id', $userId, $userId ? PDO::PARAM_INT : PDO::PARAM_NULL);
        $stmt->bindValue(':action', $data['action']);
        $stmt->bindValue(':entity_type', $data['entity_type']);
        $stmt->bindValue(':entity_id', $entityId, $entityId ? PDO::PARAM_INT : PDO::PARAM_NULL);
        $stmt->bindValue(':entity_label', $data['entity_label'] ?? null);
        $stmt->bindValue(':details', $data['details'] ?? null);
        $stmt->bindValue(':ip_address', $data['ip_address'] ?? null);
        return $stmt->execute() ? (int) $this->db->lastInsertId() : false;
    }

    public function findPaginated($page = 1, $limit = 5, $entityType = null, $search = null)
    {
        $offset = ($page - 1) * $limit;
        $where = self::baseWhere();
        $params = [];

        if ($entityType && $entityType !== 'all') {
            $where .= ' AND a.entity_type = :entity_type';
            $params[':entity_type'] = $entityType;
        }

        if ($search) {
            $where .= ' AND (u.name LIKE :q OR u.email LIKE :q OR a.entity_label LIKE :q OR a.details LIKE :q OR CAST(a.id AS CHAR) LIKE :q)';
            $params[':q'] = '%' . $search . '%';
        }

        $countSql = "SELECT COUNT(*) FROM {$this->table} a LEFT JOIN users u ON u.id = a.user_id WHERE $where";
        $countStmt = $this->db->prepare($countSql);
        foreach ($params as $k => $v) {
            $countStmt->bindValue($k, $v);
        }
        $countStmt->execute();
        $total = (int) $countStmt->fetchColumn();

        $sql = "SELECT a.*, u.name AS user_name, u.email AS user_email, r.name AS role_name
                FROM {$this->table} a
                LEFT JOIN users u ON u.id = a.user_id
                LEFT JOIN roles r ON r.id = u.role_id
                WHERE $where
                ORDER BY a.created_at DESC
                LIMIT :limit OFFSET :offset";
        $stmt = $this->db->prepare($sql);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue(':limit', (int) $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int) $offset, PDO::PARAM_INT);
        $stmt->execute();

        return [
            'data'      => $stmt->fetchAll(PDO::FETCH_ASSOC),
            'total'     => $total,
            'page'      => (int) $page,
            'last_page' => max(1, (int) ceil($total / $limit)),
        ];
    }

    public function getStats()
    {
        $exclude = "entity_type NOT IN ('" . implode("','", self::EXCLUDED_ENTITY_TYPES) . "')";

        $total = (int) $this->db->query("SELECT COUNT(*) FROM {$this->table} WHERE $exclude")->fetchColumn();
        $today = (int) $this->db->query(
            "SELECT COUNT(*) FROM {$this->table} WHERE $exclude AND DATE(created_at) = CURDATE()"
        )->fetchColumn();

        $critical = (int) $this->db->query(
            "SELECT COUNT(*) FROM {$this->table} WHERE $exclude AND action IN ('delete','deny','reject')"
        )->fetchColumn();

        $activeToday = (int) $this->db->query(
            "SELECT COUNT(DISTINCT user_id) FROM {$this->table}
             WHERE $exclude AND user_id IS NOT NULL AND DATE(created_at) = CURDATE()"
        )->fetchColumn();

        $last = $this->db->query(
            "SELECT created_at FROM {$this->table} WHERE $exclude ORDER BY created_at DESC LIMIT 1"
        )->fetchColumn();

        return [
            'total'              => $total,
            'today'              => $today,
            'critical'           => $critical,
            'active_users_today' => $activeToday,
            'last_activity_at'   => $last ?: null,
        ];
    }

    public function getEntityBreakdown($limit = 5)
    {
        $exclude = "entity_type NOT IN ('" . implode("','", self::EXCLUDED_ENTITY_TYPES) . "')";
        $rows = $this->db->query(
            "SELECT entity_type, COUNT(*) AS cnt
             FROM {$this->table}
             WHERE $exclude
             GROUP BY entity_type
             ORDER BY cnt DESC
             LIMIT " . (int) $limit
        )->fetchAll(PDO::FETCH_ASSOC);

        $max = 0;
        foreach ($rows as $r) {
            $max = max($max, (int) $r['cnt']);
        }

        return array_map(function ($r) use ($max) {
            $cnt = (int) $r['cnt'];
            return [
                'entity_type' => $r['entity_type'],
                'label'       => self::entityLabel($r['entity_type']),
                'count'       => $cnt,
                'percent'     => $max > 0 ? (int) round(($cnt / $max) * 100) : 0,
            ];
        }, $rows);
    }

    public static function entityLabel(string $type): string
    {
        $map = [
            'user'          => 'User',
            'client'        => 'Client',
            'order'         => 'Order',
            'extinguisher'  => 'Extinguisher',
            'inspection'    => 'Inspection',
            'service_request' => 'Service request',
            'mandatory'     => 'Mandatory inspection',
            'report'        => 'Report',
            'location'      => 'Location',
            'permission'    => 'Permission',
        ];
        return $map[$type] ?? ucfirst(str_replace('_', ' ', $type));
    }

    public static function actionLabel(string $action, string $entityType): string
    {
        $key = $entityType . ':' . $action;
        $map = [
            'order:create'       => 'Order placed',
            'order:grant'        => 'Order approved',
            'order:deny'         => 'Order denied',
            'order:deliver'      => 'Order delivered',
            'extinguisher:create' => 'Unit registered',
            'extinguisher:update' => 'Inventory updated',
            'extinguisher:delete' => 'Unit removed',
            'client:create'      => 'Client registered',
            'client:approve'     => 'Client approved',
            'client:reject'      => 'Client rejected',
            'user:create'        => 'User created',
            'user:delete'        => 'User removed',
            'report:export'      => 'Report exported',
            'inspection:assign'  => 'Inspection assigned',
            'inspection:complete' => 'Inspection completed',
            'mandatory:assign'   => 'Mandatory inspection assigned',
            'service_request:create' => 'Service request submitted',
        ];
        if (isset($map[$key])) {
            return $map[$key];
        }

        $verbs = [
            'create'   => 'Created',
            'update'   => 'Updated',
            'delete'   => 'Removed',
            'grant'    => 'Approved',
            'approve'  => 'Approved',
            'deny'     => 'Denied',
            'reject'   => 'Rejected',
            'deliver'  => 'Delivered',
            'export'   => 'Exported',
            'assign'   => 'Assigned',
            'complete' => 'Completed',
        ];
        $verb = $verbs[$action] ?? ucfirst($action);
        return self::entityLabel($entityType) . ' — ' . $verb;
    }

    public function exportAll($entityType = null, $search = null)
    {
        $where = self::baseWhere();
        $params = [];
        if ($entityType && $entityType !== 'all') {
            $where .= ' AND a.entity_type = :entity_type';
            $params[':entity_type'] = $entityType;
        }
        if ($search) {
            $where .= ' AND (u.name LIKE :q OR u.email LIKE :q OR a.entity_label LIKE :q OR a.details LIKE :q)';
            $params[':q'] = '%' . $search . '%';
        }

        $sql = "SELECT a.id, u.name AS user_name, u.email AS user_email, r.name AS role_name,
                       a.action, a.entity_type, a.entity_label, a.details, a.ip_address, a.created_at
                FROM {$this->table} a
                LEFT JOIN users u ON u.id = a.user_id
                LEFT JOIN roles r ON r.id = u.role_id
                WHERE $where
                ORDER BY a.created_at DESC
                LIMIT 5000";
        $stmt = $this->db->prepare($sql);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
