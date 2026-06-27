<?php

class Permission extends Model
{
    protected $table = 'permissions';

    /** Catalog permissions only (legacy, group-less keys are hidden from pickers). */
    public function findAllKeys()
    {
        $stmt = $this->db->query("SELECT id, `key`, label, description, group_name, sort_order FROM permissions WHERE group_name IS NOT NULL ORDER BY sort_order, id");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    private function catalog(): array
    {
        return require __DIR__ . '/../config/permissions_catalog.php';
    }

    /** Expand any legacy keys into their new permission bundles; pass new keys through. */
    private function expandLegacyKeys(array $keys): array
    {
        $map = $this->catalog()['legacy_map'] ?? [];
        $out = [];
        foreach ($keys as $k) {
            if (isset($map[$k])) {
                foreach ($map[$k] as $nk) {
                    $out[] = $nk;
                }
            } else {
                $out[] = $k;
            }
        }
        return array_values(array_unique($out));
    }

    /** Additively grant a list of permission keys to a user. */
    public function grantKeys($userId, array $keys): void
    {
        $keys = $this->expandLegacyKeys($keys);
        if (empty($keys)) {
            return;
        }
        $stmt = $this->db->prepare(
            "INSERT IGNORE INTO user_permissions (user_id, permission_id)
             SELECT ?, id FROM permissions WHERE `key` = ?"
        );
        foreach ($keys as $key) {
            $stmt->execute([$userId, $key]);
        }
    }

    /** Grant the default permission bundle for a role (additive). */
    public function applyRoleDefaults($userId, string $roleName): void
    {
        $defaults = $this->catalog()['role_defaults'][$roleName] ?? [];
        $this->grantKeys($userId, $defaults);
    }

    /** Role -> default permission key bundles (templates for the management UI). */
    public function roleDefaults(): array
    {
        return $this->catalog()['role_defaults'] ?? [];
    }

    /** All permission keys in the system (used to grant Super Admin everything). */
    public function allKeys(): array
    {
        return array_column($this->db->query("SELECT `key` FROM permissions")->fetchAll(PDO::FETCH_ASSOC), 'key');
    }

    /**
     * Catalog grouped for the management UI:
     * [ ['name' => 'Clients', 'permissions' => [ ['key','label','description'], ... ] ], ... ]
     */
    public function groupedCatalog(): array
    {
        $rows = $this->db->query(
            "SELECT `key`, label, description, group_name, sort_order
             FROM permissions WHERE group_name IS NOT NULL ORDER BY sort_order, id"
        )->fetchAll(PDO::FETCH_ASSOC);

        $groups = [];
        foreach ($rows as $r) {
            $g = $r['group_name'];
            if (!isset($groups[$g])) {
                $groups[$g] = ['name' => $g, 'permissions' => []];
            }
            $groups[$g]['permissions'][] = [
                'key' => $r['key'],
                'label' => $r['label'],
                'description' => $r['description'],
            ];
        }
        return array_values($groups);
    }

    public function getUserPermissions($userId)
    {
        $query = "SELECT p.`key` FROM user_permissions up
                  JOIN permissions p ON p.id = up.permission_id
                  WHERE up.user_id = :uid";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':uid', $userId);
        $stmt->execute();
        return array_column($stmt->fetchAll(PDO::FETCH_ASSOC), 'key');
    }

    public function setUserPermissions($userId, array $keys)
    {
        $keys = $this->expandLegacyKeys($keys);
        $this->db->prepare("DELETE FROM user_permissions WHERE user_id = ?")->execute([$userId]);
        if (empty($keys)) {
            return true;
        }
        $stmt = $this->db->prepare(
            "INSERT IGNORE INTO user_permissions (user_id, permission_id)
             SELECT ?, id FROM permissions WHERE `key` = ?"
        );
        foreach ($keys as $key) {
            $stmt->execute([$userId, $key]);
        }
        return true;
    }

    public function userHas($userId, $key)
    {
        $query = "SELECT 1 FROM user_permissions up
                  JOIN permissions p ON p.id = up.permission_id
                  WHERE up.user_id = :uid AND p.`key` = :pkey LIMIT 1";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':uid', $userId);
        $stmt->bindParam(':pkey', $key);
        $stmt->execute();
        return (bool) $stmt->fetch();
    }
}
