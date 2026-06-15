<?php

class Permission extends Model
{
    protected $table = 'permissions';

    public function findAllKeys()
    {
        $stmt = $this->db->query("SELECT id, `key`, label, description FROM permissions ORDER BY id");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
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
        $this->db->prepare("DELETE FROM user_permissions WHERE user_id = ?")->execute([$userId]);
        if (empty($keys)) {
            return true;
        }
        $stmt = $this->db->prepare(
            "INSERT INTO user_permissions (user_id, permission_id)
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
