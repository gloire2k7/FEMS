<?php

class User extends Model
{
    protected $table = 'users';

    public function findByEmail($email)
    {
        $query = "SELECT u.*, r.name as role_name FROM {$this->table} u
                  LEFT JOIN roles r ON r.id = u.role_id
                  WHERE LOWER(u.email) = LOWER(:email) LIMIT 1";
        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':email', trim($email));
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function findById($id)
    {
        $query = "SELECT u.*, r.name as role_name FROM {$this->table} u
                  LEFT JOIN roles r ON r.id = u.role_id
                  WHERE u.id = :id LIMIT 1";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function findAdminsPaginated($page = 1, $limit = 10, $status = null)
    {
        return $this->findByRolePaginated('Admin', $page, $limit, $status);
    }

    public function findInspectorsPaginated($page = 1, $limit = 10, $status = null)
    {
        return $this->findByRolePaginated('Inspector', $page, $limit, $status);
    }

    private function findByRolePaginated($roleName, $page = 1, $limit = 10, $status = null)
    {
        $offset = ($page - 1) * $limit;
        $where = "r.name = :role_name";
        $params = [':role_name' => $roleName];
        if ($status && in_array($status, ['active', 'inactive'], true)) {
            $where .= " AND u.status = :status";
            $params[':status'] = $status;
        }

        $countSql = "SELECT COUNT(*) FROM users u JOIN roles r ON r.id = u.role_id WHERE $where";
        $countStmt = $this->db->prepare($countSql);
        $countStmt->execute($params);
        $total = (int) $countStmt->fetchColumn();

        $query = "SELECT u.id, u.name, u.email, u.status, u.created_at, r.name as role_name
                  FROM users u JOIN roles r ON r.id = u.role_id
                  WHERE $where
                  ORDER BY u.created_at DESC LIMIT :limit OFFSET :offset";
        $stmt = $this->db->prepare($query);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue(':limit', (int) $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int) $offset, PDO::PARAM_INT);
        $stmt->execute();

        return [
            'data' => $stmt->fetchAll(PDO::FETCH_ASSOC),
            'total' => $total,
            'page' => (int) $page,
            'last_page' => max(1, (int) ceil($total / $limit)),
        ];
    }

    public function findPendingClients($page = 1, $limit = 10)
    {
        $offset = ($page - 1) * $limit;
        $countStmt = $this->db->query(
            "SELECT COUNT(*) FROM users u JOIN roles r ON r.id = u.role_id WHERE r.name = 'Company User' AND u.status = 'pending'"
        );
        $total = (int) $countStmt->fetchColumn();

        $query = "SELECT u.id, u.name, u.email, u.status, u.created_at, u.company_id,
                         c.company_name, c.phone, c.address
                  FROM users u
                  JOIN roles r ON r.id = u.role_id
                  LEFT JOIN clients c ON c.id = u.company_id
                  WHERE r.name = 'Company User' AND u.status = 'pending'
                  ORDER BY u.created_at DESC LIMIT :limit OFFSET :offset";
        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':limit', (int) $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int) $offset, PDO::PARAM_INT);
        $stmt->execute();

        return [
            'data' => $stmt->fetchAll(PDO::FETCH_ASSOC),
            'total' => $total,
            'page' => (int) $page,
            'last_page' => max(1, (int) ceil($total / $limit)),
        ];
    }

    public function findClientsPaginated($page = 1, $limit = 10, $status = null)
    {
        $offset = ($page - 1) * $limit;
        $where = "r.name = 'Company User'";
        $params = [];
        if ($status) {
            $where .= " AND u.status = :status";
            $params[':status'] = $status;
        }

        $countSql = "SELECT COUNT(*) FROM users u JOIN roles r ON r.id = u.role_id WHERE $where";
        $countStmt = $this->db->prepare($countSql);
        $countStmt->execute($params);
        $total = (int) $countStmt->fetchColumn();

        $query = "SELECT u.id, u.name, u.email, u.status, u.created_at, u.company_id,
                         c.company_name, c.phone, c.address, c.contact_person
                  FROM users u
                  JOIN roles r ON r.id = u.role_id
                  LEFT JOIN clients c ON c.id = u.company_id
                  WHERE $where
                  ORDER BY u.created_at DESC LIMIT :limit OFFSET :offset";
        $stmt = $this->db->prepare($query);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue(':limit', (int) $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int) $offset, PDO::PARAM_INT);
        $stmt->execute();

        return [
            'data' => $stmt->fetchAll(PDO::FETCH_ASSOC),
            'total' => $total,
            'page' => (int) $page,
            'last_page' => max(1, (int) ceil($total / $limit)),
        ];
    }

    public function create($data)
    {
        $query = "INSERT INTO {$this->table} (name, email, password, role_id, company_id, status, must_change_password)
                  VALUES (:name, :email, :password, :role_id, :company_id, :status, :must_change_password)";
        $stmt = $this->db->prepare($query);

        $hashed = password_hash($data['password'], PASSWORD_DEFAULT);
        $status = $data['status'] ?? 'active';
        $company_id = $data['company_id'] ?? null;
        $mustChange = isset($data['must_change_password']) ? (int) $data['must_change_password'] : 0;

        $stmt->bindParam(':name', $data['name']);
        $stmt->bindParam(':email', $data['email']);
        $stmt->bindParam(':password', $hashed);
        $stmt->bindParam(':role_id', $data['role_id']);
        $stmt->bindParam(':company_id', $company_id);
        $stmt->bindParam(':status', $status);
        $stmt->bindParam(':must_change_password', $mustChange, PDO::PARAM_INT);

        return $stmt->execute() ? $this->db->lastInsertId() : false;
    }

    public function update($id, $data)
    {
        $fields = [];
        $params = [':id' => $id];
        foreach (['name', 'role_id', 'company_id', 'status'] as $f) {
            if (array_key_exists($f, $data)) {
                $fields[] = "$f = :$f";
                $params[":$f"] = $data[$f];
            }
        }
        if (empty($fields)) {
            return false;
        }
        $query = "UPDATE {$this->table} SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $this->db->prepare($query);
        return $stmt->execute($params);
    }

    public function setStatus($id, $status)
    {
        $stmt = $this->db->prepare("UPDATE {$this->table} SET status = :status WHERE id = :id");
        $stmt->bindParam(':status', $status);
        $stmt->bindParam(':id', $id);
        return $stmt->execute();
    }

    public function setPassword($id, $plainPassword)
    {
        $hash = password_hash($plainPassword, PASSWORD_DEFAULT);
        $stmt = $this->db->prepare(
            "UPDATE {$this->table} SET password = :password, must_change_password = 0 WHERE id = :id"
        );
        $stmt->bindValue(':password', $hash);
        $stmt->bindValue(':id', (int) $id, PDO::PARAM_INT);
        return $stmt->execute();
    }
}
