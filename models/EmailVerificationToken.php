<?php

class EmailVerificationToken extends Model
{
    protected $table = 'email_verification_tokens';

    private const OTP_TTL_MINUTES = 10;

    public function createForUser(int $userId): string
    {
        $this->invalidateForUser($userId);

        $otp = (string) random_int(100000, 999999);
        $hash = hash('sha256', $otp);

        $stmt = $this->db->prepare(
            "INSERT INTO {$this->table} (user_id, otp_hash, expires_at)
             VALUES (:user_id, :otp_hash, DATE_ADD(NOW(), INTERVAL " . (int) self::OTP_TTL_MINUTES . " MINUTE))"
        );
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':otp_hash', $hash);
        $stmt->execute();

        return $otp;
    }

    public function findValidForUser(int $userId, string $otp): ?array
    {
        $otp = preg_replace('/\D/', '', trim($otp));
        if (strlen($otp) !== 6) {
            return null;
        }

        $hash = hash('sha256', $otp);
        $stmt = $this->db->prepare(
            "SELECT * FROM {$this->table}
             WHERE user_id = :user_id
               AND otp_hash = :otp_hash
               AND used_at IS NULL
               AND expires_at > NOW()
             LIMIT 1"
        );
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':otp_hash', $hash);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public function markUsed(int $id): bool
    {
        $stmt = $this->db->prepare("UPDATE {$this->table} SET used_at = NOW() WHERE id = :id");
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
