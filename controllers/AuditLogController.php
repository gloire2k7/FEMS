<?php

class AuditLogController extends Controller
{
    private $model;

    public function __construct()
    {
        $this->model = new AuditLog();
    }

    public function index()
    {
        AuthMiddleware::hasPermission('activity_logs.view');

        $page = max(1, (int) ($_GET['page'] ?? 1));
        $limit = min(5, max(1, (int) ($_GET['limit'] ?? 5)));
        $entity = !empty($_GET['entity']) ? $_GET['entity'] : 'all';
        $search = !empty($_GET['search']) ? trim($_GET['search']) : null;

        $result = $this->model->findPaginated($page, $limit, $entity, $search);
        $result['stats'] = $this->model->getStats();
        $result['entity_breakdown'] = $this->model->getEntityBreakdown();
        $result['data'] = array_map([$this, 'formatRow'], $result['data']);

        $this->jsonResponse($result);
    }

    public function export()
    {
        AuthMiddleware::hasPermission('activity_logs.export');

        $entity = !empty($_GET['entity']) ? $_GET['entity'] : 'all';
        $search = !empty($_GET['search']) ? trim($_GET['search']) : null;
        $rows = $this->model->exportAll($entity, $search);

        $filename = 'fems_activity_logs_' . date('Ymd_His') . '.csv';
        $path = __DIR__ . '/../uploads/reports/' . $filename;
        if (!is_dir(dirname($path))) {
            mkdir(dirname($path), 0777, true);
        }

        require_once __DIR__ . '/../helpers/pdf_branding_helper.php';
        $csvRows = array_map(static function ($r) {
            return [
                'LOG-' . str_pad((string) $r['id'], 5, '0', STR_PAD_LEFT),
                $r['user_name'] ?? 'System',
                $r['user_email'] ?? '',
                $r['role_name'] ?? '',
                AuditLog::actionLabel($r['action'], $r['entity_type']),
                AuditLog::entityLabel($r['entity_type']),
                $r['entity_label'] ?? '',
                $r['details'] ?? '',
                $r['ip_address'] ?? '',
                $r['created_at'],
            ];
        }, $rows);

        PdfBrandingHelper::writeCsvFile(
            $path,
            'Activity Logs Export',
            ['Log ID', 'User', 'Email', 'Role', 'Activity', 'Category', 'Entity label', 'Details', 'IP', 'Timestamp'],
            $csvRows
        );

        $this->jsonResponse([
            'message'   => 'Export ready',
            'file_path' => '/uploads/reports/' . $filename,
        ]);
    }

    private function formatRow(array $row): array
    {
        $ts = strtotime($row['created_at'] ?? 'now');
        $action = $row['action'] ?? 'update';
        $entityType = $row['entity_type'] ?? '';

        return [
            'id'           => (int) $row['id'],
            'log_id'       => 'LOG-' . str_pad((string) $row['id'], 5, '0', STR_PAD_LEFT),
            'name'         => $row['user_name'] ?? 'System',
            'email'        => $row['user_email'] ?? '',
            'role'         => $row['role_name'] ?? '—',
            'action'       => AuditLog::actionLabel($action, $entityType),
            'action_key'   => $action,
            'entity'       => AuditLog::entityLabel($entityType),
            'entity_type'  => $entityType,
            'entity_label' => $row['entity_label'] ?? '',
            'details'      => $row['details'] ?? '',
            'date'         => date('M j, Y', $ts),
            'time'         => date('H:i:s', $ts),
            'created_at'   => $row['created_at'],
            'actionClass'  => self::actionClass($action),
            'roleClass'    => self::roleClass($row['role_name'] ?? ''),
        ];
    }

    private static function actionClass(string $action): string
    {
        $map = [
            'login'    => 'bg-slate-100 text-slate-600',
            'logout'   => 'bg-slate-100 text-slate-600',
            'create'   => 'bg-emerald-50 text-emerald-600',
            'grant'    => 'bg-emerald-50 text-emerald-600',
            'approve'  => 'bg-emerald-50 text-emerald-600',
            'update'   => 'bg-amber-50 text-amber-600',
            'assign'   => 'bg-indigo-50 text-indigo-600',
            'complete' => 'bg-blue-50 text-blue-600',
            'export'   => 'bg-indigo-50 text-indigo-600',
            'delete'   => 'bg-red-50 text-red-600',
            'deny'     => 'bg-red-50 text-red-600',
            'reject'   => 'bg-red-50 text-red-600',
            'deliver'  => 'bg-teal-50 text-teal-600',
        ];
        return $map[$action] ?? 'bg-slate-100 text-slate-600';
    }

    private static function roleClass(string $role): string
    {
        $map = [
            'Super Admin'  => 'bg-violet-50 text-violet-600',
            'Admin'        => 'bg-violet-50 text-violet-600',
            'Inspector'    => 'bg-amber-50 text-amber-600',
            'Company User' => 'bg-blue-50 text-blue-600',
        ];
        return $map[$role] ?? 'bg-slate-100 text-slate-600';
    }
}
