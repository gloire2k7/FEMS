<?php

class AuditHelper
{
    public static function log(
        string $action,
        string $entityType,
        ?int $entityId = null,
        ?string $entityLabel = null,
        ?string $details = null,
        ?int $userId = null
    ): void {
        try {
            $uid = $userId ?? ($_SESSION['user_id'] ?? null);
            $model = new AuditLog();
            $model->create([
                'user_id'      => $uid,
                'action'       => strtolower($action),
                'entity_type'  => $entityType,
                'entity_id'    => $entityId,
                'entity_label' => $entityLabel,
                'details'      => $details,
                'ip_address'   => self::clientIp(),
            ]);
        } catch (Throwable $e) {
            error_log('Audit log failed: ' . $e->getMessage());
        }
    }

    private static function clientIp(): ?string
    {
        return $_SERVER['HTTP_X_FORWARDED_FOR']
            ?? $_SERVER['REMOTE_ADDR']
            ?? null;
    }
}
