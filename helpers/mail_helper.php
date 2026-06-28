<?php

class MailHelper
{
    private static $smtpHost = 'smtp.gmail.com';
    private static $smtpPort = 587;
    private static $smtpUser = 'sengagloire2007@gmail.com';
    private static $smtpPass = 'eclbffwbstbcijov';
    private static $fromName = 'FEMS · Codebridge Fire Tech Solutions';

    /**
     * Send an HTML email via Gmail SMTP (STARTTLS).
     */
    public static function sendEmail(string $to, string $subject, string $body): bool
    {
        $logDir = __DIR__ . '/../logs';
        if (!is_dir($logDir)) {
            mkdir($logDir, 0777, true);
        }

        try {
            $conn = fsockopen('tcp://' . self::$smtpHost, self::$smtpPort, $errno, $errstr, 30);
            if (!$conn) {
                throw new Exception("SMTP connect failed ($errno): $errstr");
            }

            stream_set_timeout($conn, 15);

            self::read($conn); // greeting

            self::cmd($conn, 'EHLO localhost');
            self::cmd($conn, 'STARTTLS');

            // Upgrade to TLS
            if (!stream_socket_enable_crypto($conn, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                throw new Exception('TLS negotiation failed');
            }

            self::cmd($conn, 'EHLO localhost');
            self::cmd($conn, 'AUTH LOGIN');
            self::cmd($conn, base64_encode(self::$smtpUser));
            self::cmd($conn, base64_encode(self::$smtpPass));
            self::cmd($conn, 'MAIL FROM:<' . self::$smtpUser . '>');
            self::cmd($conn, 'RCPT TO:<' . $to . '>');
            self::cmd($conn, 'DATA');

            $message  = 'From: ' . self::$fromName . ' <' . self::$smtpUser . ">\r\n";
            $message .= 'To: ' . $to . "\r\n";
            $message .= 'Subject: ' . $subject . "\r\n";
            $message .= "MIME-Version: 1.0\r\n";
            $message .= "Content-Type: text/html; charset=UTF-8\r\n";
            $message .= "\r\n";
            $message .= $body . "\r\n.\r\n";

            fwrite($conn, $message);
            self::read($conn);
            self::cmd($conn, 'QUIT');
            fclose($conn);

            file_put_contents(
                $logDir . '/mail.log',
                date('Y-m-d H:i:s') . " | To: $to | Subject: $subject | Sent: yes\n",
                FILE_APPEND
            );

            return true;
        } catch (Exception $e) {
            file_put_contents(
                $logDir . '/mail.log',
                date('Y-m-d H:i:s') . " | To: $to | Subject: $subject | ERROR: " . $e->getMessage() . "\n",
                FILE_APPEND
            );
            return false;
        }
    }

    private static function read($conn): string
    {
        $response = '';
        while ($line = fgets($conn, 515)) {
            $response .= $line;
            if (isset($line[3]) && $line[3] === ' ') {
                break;
            }
        }
        return $response;
    }

    private static function cmd($conn, string $cmd): string
    {
        fwrite($conn, $cmd . "\r\n");
        return self::read($conn);
    }

    private const BRAND = '#0B1437';
    private const APP_URL = 'http://localhost:4200';

    private static function logoImg(): string
    {
        foreach ([
            __DIR__ . '/../uploads/branding/codebridge-logo.jpg',
            __DIR__ . '/../LOGO_cd0ggp.jpg',
        ] as $path) {
            if (is_readable($path)) {
                $data = base64_encode(file_get_contents($path));
                return '<img src="data:image/jpeg;base64,' . $data . '" alt="Codebridge Fire Tech Solutions" width="150" style="display:block;margin:0 auto 12px;height:auto;" />';
            }
        }
        return '<p style="margin:0;color:#ffffff;font-size:16px;font-weight:700;">Codebridge Fire Tech Solutions</p>';
    }

    /** Consistent branded email layout. */
    private static function emailShell(string $headline, string $innerHtml, ?string $ctaText = null, ?string $ctaUrl = null): string
    {
        $logo = self::logoImg();
        $cta = ($ctaText && $ctaUrl)
            ? '<div style="text-align:center;margin:28px 0 4px;"><a href="' . htmlspecialchars($ctaUrl)
              . '" style="display:inline-block;background:' . self::BRAND . ';color:#ffffff;text-decoration:none;padding:13px 32px;border-radius:8px;font-size:14px;font-weight:600;">'
              . htmlspecialchars($ctaText) . '</a></div>'
            : '';
        $headlineEsc = htmlspecialchars($headline);

        return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F4F7FE;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F7FE;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #E0E5F2;">
        <tr>
          <td style="background:#0B1437;padding:28px 32px 24px;text-align:center;">
            {$logo}
            <p style="margin:6px 0 0;color:#94A3B8;font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;">Fire Extinguisher Management System</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 36px;">
            <h1 style="margin:0 0 18px;color:#0B1437;font-size:21px;font-weight:700;line-height:1.35;">{$headlineEsc}</h1>
            {$innerHtml}
            {$cta}
          </td>
        </tr>
        <tr>
          <td style="background:#F8FAFC;padding:18px 36px;text-align:center;border-top:1px solid #E2E8F0;">
            <p style="margin:0 0 4px;color:#64748B;font-size:12px;font-weight:600;">FEMS · Codebridge Fire Tech Solutions</p>
            <p style="margin:0;color:#94A3B8;font-size:11px;">Automated message — please do not reply to this email.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
HTML;
    }

    private static function box(string $content, string $bg = '#F8FAFC', string $border = '#E2E8F0'): string
    {
        return '<div style="background:' . $bg . ';border:1px solid ' . $border . ';border-radius:8px;padding:18px 22px;margin-bottom:20px;">' . $content . '</div>';
    }

    private static function p(string $text): string
    {
        return '<p style="margin:0 0 14px;color:#475569;font-size:15px;line-height:1.6;">' . $text . '</p>';
    }

    // -------------------------------------------------------------------------
    // Permission group labels (mirrors the sidebar)
    // -------------------------------------------------------------------------
    private static $permissionGroups = [
        'Operations' => [
            'manage_clients'      => 'Clients Management',
            'manage_locations'    => 'Location Management',
            'manage_inventory'    => 'Inventory Management',
            'manage_orders'       => 'Orders Management',
        ],
        'Compliance' => [
            'manage_inspections'  => 'Inspections Management',
            'manage_inspectors'   => 'Inspectors Management',
            'manage_refills'      => 'Refills Management',
        ],
        'System' => [
            'manage_notifications' => 'Notifications',
            'manage_settings'      => 'Settings',
            'manage_ai_assistant'  => 'AI Assistant',
        ],
    ];

    /**
     * Build the HTML block listing the granted permissions grouped by section.
     */
    private static function buildPermissionsHtml(array $permKeys): string
    {
        if (empty($permKeys)) {
            return '<p style="color:#6b7280;font-style:italic;">No specific permissions assigned.</p>';
        }

        $html = '';
        foreach (self::$permissionGroups as $group => $items) {
            $granted = [];
            foreach ($items as $key => $label) {
                if (in_array($key, $permKeys, true)) {
                    $granted[] = $label;
                }
            }
            if (empty($granted)) {
                continue;
            }
            $html .= '<p style="margin:12px 0 4px;font-weight:600;color:#374151;font-size:13px;text-transform:uppercase;letter-spacing:.05em;">'
                   . htmlspecialchars($group) . '</p><ul style="margin:0;padding-left:20px;">';
            foreach ($granted as $label) {
                $html .= '<li style="color:#374151;margin:2px 0;">' . htmlspecialchars($label) . '</li>';
            }
            $html .= '</ul>';
        }
        return $html ?: '<p style="color:#6b7280;font-style:italic;">No specific permissions assigned.</p>';
    }

    /**
     * Admin invite email: credentials + permissions list + password-reset CTA.
     *
     * @param string   $email      Admin's email address
     * @param string   $name       Admin's display name
     * @param string   $password   Plain-text generated password
     * @param string[] $permKeys   Array of permission key strings granted to this admin
     */
    public static function sendAdminCredentials(string $email, string $name, string $password, array $permKeys = []): bool
    {
        $subject = 'Your FEMS Admin Account — Action Required';
        $permissionsHtml = self::buildPermissionsHtml($permKeys);
        $signinUrl = self::APP_URL . '/signin';
        $emailEsc = htmlspecialchars($email);
        $nameEsc = htmlspecialchars($name);
        $passEsc = htmlspecialchars($password);

        $inner = self::p("Hello <strong>{$nameEsc}</strong>,")
            . self::p('Your admin account has been created. Use the credentials below to sign in. <strong style="color:#DC2626;">Change your password immediately after your first login.</strong>')
            . self::box(
                '<p style="margin:0 0 12px;font-size:12px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:.06em;">Your credentials</p>'
                . '<table cellpadding="0" cellspacing="0" style="width:100%;"><tr>'
                . '<td style="padding:6px 0;color:#64748B;font-size:14px;width:90px;">Email</td>'
                . '<td style="padding:6px 0;color:#0B1437;font-size:14px;font-weight:600;">' . $emailEsc . '</td></tr><tr>'
                . '<td style="padding:6px 0;color:#64748B;font-size:14px;">Password</td>'
                . '<td style="padding:6px 0;color:#0B1437;font-size:14px;font-weight:600;font-family:Consolas,monospace;">' . $passEsc . '</td></tr></table>'
            )
            . self::box(
                '<p style="margin:0 0 10px;font-size:12px;font-weight:700;color:#15803D;text-transform:uppercase;letter-spacing:.06em;">Your permissions</p>'
                . $permissionsHtml,
                '#F0FDF4',
                '#BBF7D0'
            )
            . self::box(
                '<p style="margin:0;color:#92400E;font-size:13px;line-height:1.5;"><strong>Security reminder:</strong> Go to <strong>Settings → Change Password</strong> after signing in. Do not share these credentials.</p>',
                '#FFFBEB',
                '#FDE68A'
            );

        $body = self::emailShell('Welcome to FEMS Admin', $inner, 'Sign in & change password', $signinUrl);

        return self::sendEmail($email, $subject, $body);
    }

    /**
     * Inspector invite email: credentials + sign-in CTA (no permissions — fixed role).
     */
    public static function sendInspectorCredentials(string $email, string $name, string $password): bool
    {
        $subject = 'Your FEMS Inspector Account — Action Required';
        $signinUrl = self::APP_URL . '/signin';
        $emailEsc = htmlspecialchars($email);
        $nameEsc = htmlspecialchars($name);
        $passEsc = htmlspecialchars($password);

        $inner = self::p("Hello <strong>{$nameEsc}</strong>,")
            . self::p('Your inspector account has been created. Use the credentials below to sign in. <strong style="color:#DC2626;">Change your password immediately after your first login.</strong>')
            . self::box(
                '<p style="margin:0 0 12px;font-size:12px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:.06em;">Your credentials</p>'
                . '<table cellpadding="0" cellspacing="0"><tr>'
                . '<td style="padding:6px 16px 6px 0;color:#64748B;font-size:14px;">Email</td>'
                . '<td style="padding:6px 0;color:#0B1437;font-size:14px;font-weight:600;">' . $emailEsc . '</td></tr><tr>'
                . '<td style="padding:6px 16px 6px 0;color:#64748B;font-size:14px;">Password</td>'
                . '<td style="padding:6px 0;color:#0B1437;font-size:14px;font-weight:600;font-family:Consolas,monospace;">' . $passEsc . '</td></tr></table>'
            )
            . self::box(
                '<p style="margin:0;color:#92400E;font-size:13px;">Change your password under <strong>Settings</strong> after your first sign-in.</p>',
                '#FFFBEB',
                '#FDE68A'
            );

        $body = self::emailShell('Welcome to FEMS Inspector', $inner, 'Sign in & change password', $signinUrl);
        return self::sendEmail($email, $subject, $body);
    }

    /**
     * Password reset OTP email.
     */
    public static function sendPasswordResetOtp(string $email, string $name, string $otp): bool
    {
        $subject = 'Your FEMS password reset code';
        $nameEsc = htmlspecialchars($name);
        $otpEsc = htmlspecialchars($otp);
        $resetUrl = self::APP_URL . '/reset-password?email=' . urlencode($email);

        $inner = self::p("Hello <strong>{$nameEsc}</strong>,")
            . self::p('Use the verification code below to reset your FEMS password.')
            . self::box(
                '<p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:.08em;">Your code</p>'
                . '<p style="margin:0;font-size:32px;font-weight:800;color:#0B1437;letter-spacing:.35em;font-family:Consolas,monospace;text-align:center;">'
                . $otpEsc . '</p>',
                '#F8FAFC',
                '#E2E8F0'
            )
            . self::box(
                '<p style="margin:0;color:#64748B;font-size:13px;line-height:1.6;">This code expires in <strong>10 minutes</strong>. If you did not request a reset, ignore this email — your password will not change.</p>'
            );

        $body = self::emailShell('Password reset code', $inner, 'Enter code on FEMS', $resetUrl);
        return self::sendEmail($email, $subject, $body);
    }

    /**
     * Notify an admin that their permissions were changed by a Super Admin.
     *
     * @param string[] $addedKeys
     * @param string[] $removedKeys
     * @param string[] $currentKeys
     */
    public static function sendPermissionsUpdated(
        string $email,
        string $name,
        array $addedKeys,
        array $removedKeys,
        array $currentKeys
    ): bool {
        $subject = 'Your FEMS Admin Permissions Have Been Updated';

        $label = function (string $key): string {
            foreach (self::$permissionGroups as $items) {
                if (isset($items[$key])) {
                    return $items[$key];
                }
            }
            return $key;
        };

        $buildList = function (array $keys, string $color) use ($label): string {
            if (empty($keys)) {
                return '<p style="color:#6b7280;font-style:italic;margin:0;">None</p>';
            }
            $html = '<ul style="margin:0;padding-left:20px;">';
            foreach ($keys as $key) {
                $html .= '<li style="color:' . $color . ';margin:4px 0;">' . htmlspecialchars($label($key)) . '</li>';
            }
            return $html . '</ul>';
        };

        $addedHtml = $buildList($addedKeys, '#15803d');
        $removedHtml = $buildList($removedKeys, '#dc2626');
        $currentHtml = self::buildPermissionsHtml($currentKeys);
        $signinUrl = self::APP_URL . '/signin';
        $nameEsc = htmlspecialchars($name);

        $inner = self::p("Hello <strong>{$nameEsc}</strong>,")
            . self::p('A Super Admin has updated your administrator permissions. Your sidebar and access have been adjusted accordingly.')
            . self::box('<p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#15803D;text-transform:uppercase;">New access granted</p>' . $addedHtml, '#F0FDF4', '#BBF7D0')
            . self::box('<p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#DC2626;text-transform:uppercase;">Access revoked</p>' . $removedHtml, '#FEF2F2', '#FECACA')
            . self::box('<p style="margin:0 0 10px;font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;">Your current permissions</p>' . $currentHtml)
            . self::p('<span style="color:#94A3B8;font-size:13px;">If you are already signed in, refresh the page to see your updated sidebar.</span>');

        $body = self::emailShell('Permissions updated', $inner, 'Open admin portal', $signinUrl);
        return self::sendEmail($email, $subject, $body);
    }

    public static function sendClientApproval(string $email, string $name, bool $approved): bool
    {
        $subject = $approved
            ? 'Your FEMS account has been approved'
            : 'Your FEMS registration was not approved';

        $nameEsc = htmlspecialchars($name);

        if ($approved) {
            $inner = self::p("Hello <strong>{$nameEsc}</strong>,")
                . self::p('Your FEMS client account has been <strong style="color:#15803D;">approved</strong>. You can now sign in and start managing your fire extinguishers.');
            $body = self::emailShell('Account approved', $inner, 'Sign in to FEMS', self::APP_URL . '/signin');
        } else {
            $inner = self::p("Hello <strong>{$nameEsc}</strong>,")
                . self::p('Unfortunately your FEMS registration could not be approved at this time. Please contact your administrator for more information.');
            $body = self::emailShell('Registration not approved', $inner);
        }

        return self::sendEmail($email, $subject, $body);
    }

    /**
     * Email verification OTP for client self-registration (expires in 10 minutes).
     */
    public static function sendClientVerificationOtp(string $email, string $name, string $otp): bool
    {
        $subject = 'Verify your email — FEMS registration';
        $nameEsc = htmlspecialchars($name);
        $otpEsc = htmlspecialchars($otp);

        $inner = self::p("Hello <strong>{$nameEsc}</strong>,")
            . self::p('Thanks for registering with FEMS. Enter the verification code below to confirm your email address and continue your registration.')
            . self::box(
                '<p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:.08em;">Your verification code</p>'
                . '<p style="margin:0;font-size:32px;font-weight:800;color:#0B1437;letter-spacing:.35em;font-family:Consolas,monospace;text-align:center;">'
                . $otpEsc . '</p>',
                '#F8FAFC',
                '#E2E8F0'
            )
            . self::box(
                '<p style="margin:0;color:#64748B;font-size:13px;line-height:1.6;">This code expires in <strong>10 minutes</strong>. After your email is verified, an administrator will review and approve your account. You will then receive your sign-in credentials by email.</p>'
            );

        $body = self::emailShell('Verify your email', $inner);
        return self::sendEmail($email, $subject, $body);
    }

    /**
     * Approved client credentials: auto-generated password + first-login change reminder.
     */
    public static function sendClientCredentials(string $email, string $name, string $password): bool
    {
        $subject = 'Your FEMS account is approved — sign-in details';
        $signinUrl = self::APP_URL . '/signin';
        $emailEsc = htmlspecialchars($email);
        $nameEsc = htmlspecialchars($name);
        $passEsc = htmlspecialchars($password);

        $inner = self::p("Hello <strong>{$nameEsc}</strong>,")
            . self::p('Your FEMS client account has been <strong style="color:#15803D;">approved</strong>. Use the credentials below to sign in. <strong style="color:#DC2626;">You will be asked to set your own password on first login.</strong>')
            . self::box(
                '<p style="margin:0 0 12px;font-size:12px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:.06em;">Your credentials</p>'
                . '<table cellpadding="0" cellspacing="0" style="width:100%;"><tr>'
                . '<td style="padding:6px 0;color:#64748B;font-size:14px;width:90px;">Email</td>'
                . '<td style="padding:6px 0;color:#0B1437;font-size:14px;font-weight:600;">' . $emailEsc . '</td></tr><tr>'
                . '<td style="padding:6px 0;color:#64748B;font-size:14px;">Password</td>'
                . '<td style="padding:6px 0;color:#0B1437;font-size:14px;font-weight:600;font-family:Consolas,monospace;">' . $passEsc . '</td></tr></table>'
            )
            . self::box(
                '<p style="margin:0;color:#92400E;font-size:13px;line-height:1.5;"><strong>Security reminder:</strong> For your protection, set a new password as soon as you sign in. Do not share these credentials.</p>',
                '#FFFBEB',
                '#FDE68A'
            );

        $body = self::emailShell('Your account is approved', $inner, 'Sign in & set password', $signinUrl);
        return self::sendEmail($email, $subject, $body);
    }

    public static function sendOrderStatusUpdate(
        string $email,
        $orderId,
        string $status,
        ?string $reason = null,
        ?string $deliveryDate = null,
        ?int $grantedQty = null,
        ?int $orderedQty = null
    ): bool {
        $labels = [
            'granted'            => 'approved',
            'partially_granted'  => 'partially approved',
            'cancelled'          => 'denied',
            'delivered'          => 'confirmed as delivered',
            'pending'            => 'received and pending review',
        ];
        $label = $labels[$status] ?? $status;
        $subject = "Order #{$orderId} Update";
        $inner = self::p('Your order <strong>#' . (int) $orderId . '</strong> has been <strong>' . htmlspecialchars($label) . '</strong>.');
        if ($grantedQty !== null && $orderedQty !== null && $status === 'partially_granted') {
            $inner .= self::p('<strong>Approved:</strong> ' . (int) $grantedQty . ' of ' . (int) $orderedQty . ' units. A new pending order was created for the remainder.');
        }
        if ($deliveryDate) {
            $inner .= self::p('<strong>Expected delivery:</strong> ' . htmlspecialchars($deliveryDate));
        }
        if ($reason) {
            $inner .= self::p('<strong>Reason:</strong> ' . htmlspecialchars($reason));
        }
        $body = self::emailShell('Order update', $inner, 'Track your order', self::APP_URL . '/my-orders');
        return self::sendEmail($email, $subject, $body);
    }

    public static function sendExpirationAlert(string $email, array $extinguisher): bool
    {
        $serial = htmlspecialchars($extinguisher['serial_number'] ?? 'N/A');
        $subject = 'Alert: Fire Extinguisher Expired';
        $inner = self::p('Fire extinguisher with serial number <strong>' . $serial . '</strong> has expired and requires immediate attention.');
        $body = self::emailShell('Extinguisher expired', $inner);
        return self::sendEmail($email, $subject, $body);
    }

    public static function sendMandatoryAssignmentNotice(array $assignment): bool
    {
        $typeName = htmlspecialchars($assignment['mandatory_name'] ?? 'Mandatory inspection');
        $clientName = htmlspecialchars($assignment['company_name'] ?? 'Client');
        $inspectorName = htmlspecialchars($assignment['inspector_name'] ?? 'Inspector');
        $interval = (int) ($assignment['interval_months'] ?? 0);
        $deadline = (int) ($assignment['deadline_days'] ?? 0);

        $inspectorBody = self::emailShell(
            'Mandatory inspection assigned',
            self::p('You are now responsible for <strong>' . $typeName . '</strong> at <strong>' . $clientName . '</strong>.')
            . self::p("Schedule: every {$interval} months, must be completed within {$deadline} days after due date.")
            . self::p('Sign in to the inspector portal to manage this assignment.'),
            'Open inspector portal',
            self::APP_URL . '/signin'
        );

        $clientBody = self::emailShell(
            'Mandatory inspection inspector assigned',
            self::p('For <strong>' . $typeName . '</strong>, your assigned inspector is <strong>' . $inspectorName . '</strong>.')
            . self::p("They will conduct regular inspections every {$interval} months. Confirm completion in your service requests portal."),
            'View service requests',
            self::APP_URL . '/service-requests'
        );

        $ok1 = !empty($assignment['inspector_email'])
            ? self::sendEmail($assignment['inspector_email'], "FEMS: Mandatory inspection — {$typeName}", $inspectorBody)
            : true;
        $ok2 = !empty($assignment['client_email'])
            ? self::sendEmail($assignment['client_email'], "FEMS: Your mandatory inspection inspector", $clientBody)
            : true;
        return $ok1 && $ok2;
    }
}
