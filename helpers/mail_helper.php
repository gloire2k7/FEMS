<?php

class MailHelper
{
    public static function sendEmail($to, $subject, $body)
    {
        $headers = "MIME-Version: 1.0\r\n";
        $headers .= "Content-type: text/html; charset=UTF-8\r\n";
        $headers .= "From: FEMS <noreply@fems.local>\r\n";

        $sent = @mail($to, $subject, $body, $headers);

        $logDir = __DIR__ . '/../logs';
        if (!is_dir($logDir)) {
            mkdir($logDir, 0777, true);
        }
        file_put_contents(
            $logDir . '/mail.log',
            date('Y-m-d H:i:s') . " | To: $to | Subject: $subject | Sent: " . ($sent ? 'yes' : 'no') . "\n",
            FILE_APPEND
        );

        return true;
    }

    public static function sendAdminCredentials($email, $name, $password)
    {
        $subject = 'Your FEMS Admin Account';
        $body = "<h2>Welcome to FEMS, {$name}</h2>
            <p>Your admin account has been created.</p>
            <p><strong>Email:</strong> {$email}<br>
            <strong>Temporary password:</strong> {$password}</p>
            <p>Please sign in and change your password under Settings.</p>
            <p><a href='http://localhost:4200/signin'>Sign in to FEMS</a></p>";
        return self::sendEmail($email, $subject, $body);
    }

    public static function sendClientApproval($email, $name, $approved)
    {
        $subject = $approved ? 'Your FEMS account has been approved' : 'Your FEMS registration was declined';
        $body = $approved
            ? "<p>Hello {$name},</p><p>Your client account has been approved. You can now sign in at <a href='http://localhost:4200/signin'>FEMS</a>.</p>"
            : "<p>Hello {$name},</p><p>Unfortunately your registration could not be approved at this time. Please contact support.</p>";
        return self::sendEmail($email, $subject, $body);
    }

    public static function sendOrderStatusUpdate($email, $orderId, $status, $reason = null)
    {
        $labels = [
            'granted' => 'approved',
            'cancelled' => 'denied',
            'delivered' => 'marked as delivered',
            'pending' => 'received and pending review',
        ];
        $label = $labels[$status] ?? $status;
        $subject = "Order #{$orderId} update";
        $body = "<p>Your order <strong>#{$orderId}</strong> has been {$label}.</p>";
        if ($reason) {
            $body .= "<p><strong>Reason:</strong> {$reason}</p>";
        }
        $body .= "<p><a href='http://localhost:4200/my-orders'>Track your order</a></p>";
        return self::sendEmail($email, $subject, $body);
    }

    public static function sendExpirationAlert($email, $extinguisher)
    {
        $subject = 'Alert: Extinguisher Expired';
        $body = 'The fire extinguisher with serial ' . $extinguisher['serial_number'] . ' has expired.';
        return self::sendEmail($email, $subject, $body);
    }
}
