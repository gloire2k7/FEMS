<?php

class PasswordResetToken extends Model
{
    protected $table = 'password_reset_tokens';

    private const OTP_TTL_MINUTES = 10;

    public function createOtpForUser(int $userId): string
    {
        $this->invalidateForUser($userId);

        $otp = (string) random_int(100000, 999999);
        $hash = hash('sha256', $otp);

        $stmt = $this->db->prepare(
            "INSERT INTO {$this->table} (user_id, token_hash, expires_at)
             VALUES (:user_id, :token_hash, DATE_ADD(NOW(), INTERVAL " . (int) self::OTP_TTL_MINUTES . " MINUTE))"
        );
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':token_hash', $hash);
        $stmt->execute();

        return $otp;
    }

    public function findValidByEmailAndOtp(string $email, string $otp): ?array
    {
        $userModel = new User();
        $user = $userModel->findByEmail($email);
        if (!$user) {
            return null;
        }

        $otp = preg_replace('/\D/', '', trim($otp));
        if (strlen($otp) !== 6) {
            return null;
        }

        $hash = hash('sha256', $otp);
        $stmt = $this->db->prepare(
            "SELECT t.*, u.email, u.name, u.status
             FROM {$this->table} t
             JOIN users u ON u.id = t.user_id
             WHERE t.user_id = :user_id
               AND t.token_hash = :hash
               AND t.used_at IS NULL
               AND t.expires_at > NOW()
             LIMIT 1"
        );
        $stmt->bindValue(':user_id', (int) $user['id'], PDO::PARAM_INT);
        $stmt->bindValue(':hash', $hash);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public function markUsed(int $id): bool
    {
        $stmt = $this->db->prepare(
            "UPDATE {$this->table} SET used_at = NOW() WHERE id = :id"
        );
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }

    public function invalidateForUser(int $userId): void
    {
        $stmt = $this->db->prepare(
            "DELETE FROM {$this->table} WHERE user_id = :user_id AND used_at IS NULL"
        );
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->execute();
    }
}
