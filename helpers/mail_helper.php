<?php

class MailHelper
{
    private static $smtpHost = 'smtp.gmail.com';
    private static $smtpPort = 587;
    private static $smtpUser = 'sengagloire2007@gmail.com';
    private static $smtpPass = 'eclbffwbstbcijov';
    private static $fromName = 'FEMS System';

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
        $signinUrl = 'http://localhost:4200/signin';

        $body = <<<HTML
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1e3a8a,#1d4ed8);padding:36px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:.5px;">🔥 FEMS</h1>
            <p style="margin:6px 0 0;color:#bfdbfe;font-size:14px;">Fire Extinguisher Management System</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">Welcome, {$name}!</h2>
            <p style="margin:0 0 24px;color:#6b7280;font-size:15px;">
              Your admin account has been created. Below are your login credentials.
              <strong style="color:#dc2626;">Please change your password immediately after signing in.</strong>
            </p>

            <!-- Credentials box -->
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px 24px;margin-bottom:28px;">
              <p style="margin:0 0 10px;font-size:13px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.05em;">Your Credentials</p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:4px 12px 4px 0;color:#6b7280;font-size:14px;white-space:nowrap;">Email</td>
                  <td style="padding:4px 0;color:#111827;font-size:14px;font-weight:600;">{$email}</td>
                </tr>
                <tr>
                  <td style="padding:4px 12px 4px 0;color:#6b7280;font-size:14px;white-space:nowrap;">Password</td>
                  <td style="padding:4px 0;color:#111827;font-size:14px;font-weight:600;font-family:monospace;font-size:15px;">{$password}</td>
                </tr>
              </table>
            </div>

            <!-- Permissions box -->
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px 24px;margin-bottom:28px;">
              <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#15803d;text-transform:uppercase;letter-spacing:.05em;">Your Permissions</p>
              {$permissionsHtml}
            </div>

            <!-- CTA button -->
            <div style="text-align:center;margin-bottom:28px;">
              <a href="{$signinUrl}"
                 style="display:inline-block;background:#1d4ed8;color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:8px;font-size:15px;font-weight:600;letter-spacing:.3px;">
                Sign In &amp; Change Password
              </a>
            </div>

            <!-- Warning -->
            <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:14px 18px;">
              <p style="margin:0;color:#92400e;font-size:13px;">
                ⚠️ <strong>Security reminder:</strong> Change your password as soon as you sign in. Go to
                <strong>Settings → Change Password</strong>. Do not share these credentials with anyone.
              </p>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">
              This email was sent automatically by FEMS. If you did not expect this, please contact your system administrator.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
HTML;

        return self::sendEmail($email, $subject, $body);
    }

    /**
     * Inspector invite email: credentials + sign-in CTA (no permissions — fixed role).
     */
    public static function sendInspectorCredentials(string $email, string $name, string $password): bool
    {
        $subject = 'Your FEMS Inspector Account — Action Required';
        $signinUrl = 'http://localhost:4200/signin';

        $body = <<<HTML
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#1e3a8a,#1d4ed8);padding:36px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;">🔥 FEMS</h1>
            <p style="margin:6px 0 0;color:#bfdbfe;font-size:14px;">Fire Extinguisher Management System</p>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">Welcome, {$name}!</h2>
            <p style="margin:0 0 24px;color:#6b7280;font-size:15px;">
              Your inspector account has been created. Use the credentials below to sign in.
              <strong style="color:#dc2626;">Please change your password immediately after signing in.</strong>
            </p>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px 24px;margin-bottom:28px;">
              <p style="margin:0 0 10px;font-size:13px;font-weight:600;color:#64748b;text-transform:uppercase;">Your Credentials</p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:4px 12px 4px 0;color:#6b7280;font-size:14px;">Email</td>
                  <td style="padding:4px 0;color:#111827;font-size:14px;font-weight:600;">{$email}</td>
                </tr>
                <tr>
                  <td style="padding:4px 12px 4px 0;color:#6b7280;font-size:14px;">Password</td>
                  <td style="padding:4px 0;color:#111827;font-size:14px;font-weight:600;font-family:monospace;">{$password}</td>
                </tr>
              </table>
            </div>
            <div style="text-align:center;margin-bottom:28px;">
              <a href="{$signinUrl}"
                 style="display:inline-block;background:#1d4ed8;color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:8px;font-size:15px;font-weight:600;">
                Sign In &amp; Change Password
              </a>
            </div>
            <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:14px 18px;">
              <p style="margin:0;color:#92400e;font-size:13px;">
                ⚠️ Change your password under <strong>Settings</strong> after your first sign-in.
              </p>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">Sent automatically by FEMS.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
HTML;

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
        $signinUrl = 'http://localhost:4200/signin';

        $body = <<<HTML
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#1e3a8a,#1d4ed8);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">🔥 FEMS</h1>
            <p style="margin:6px 0 0;color:#bfdbfe;font-size:14px;">Permission update notice</p>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">Hello, {$name}</h2>
            <p style="margin:0 0 24px;color:#6b7280;font-size:15px;">
              A Super Admin has updated your administrator permissions. Your sidebar and access have been adjusted accordingly.
            </p>

            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:18px 22px;margin-bottom:16px;">
              <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#15803d;text-transform:uppercase;">New access granted</p>
              {$addedHtml}
            </div>

            <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:18px 22px;margin-bottom:16px;">
              <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#dc2626;text-transform:uppercase;">Access revoked</p>
              {$removedHtml}
            </div>

            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:18px 22px;margin-bottom:24px;">
              <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#374151;text-transform:uppercase;">Your current permissions</p>
              {$currentHtml}
            </div>

            <div style="text-align:center;">
              <a href="{$signinUrl}" style="display:inline-block;background:#1d4ed8;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:15px;font-weight:600;">
                Open Admin Portal
              </a>
            </div>
            <p style="margin:24px 0 0;color:#9ca3af;font-size:13px;text-align:center;">
              If you are already signed in, refresh the page or navigate to any menu item to see your updated sidebar.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
HTML;

        return self::sendEmail($email, $subject, $body);
    }

    public static function sendClientApproval(string $email, string $name, bool $approved): bool
    {
        $subject = $approved
            ? 'Your FEMS account has been approved'
            : 'Your FEMS registration was not approved';

        if ($approved) {
            $body = <<<HTML
<!DOCTYPE html><html><body style="font-family:'Segoe UI',Arial,sans-serif;background:#f3f4f6;padding:40px;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:36px;box-shadow:0 2px 12px rgba(0,0,0,.08);">
    <h2 style="color:#15803d;">Account Approved ✓</h2>
    <p>Hello <strong>{$name}</strong>,</p>
    <p>Your FEMS client account has been <strong>approved</strong>. You can now sign in and start managing your fire extinguishers.</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="http://localhost:4200/signin" style="background:#1d4ed8;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:600;">Sign In to FEMS</a>
    </div>
  </div>
</body></html>
HTML;
        } else {
            $body = <<<HTML
<!DOCTYPE html><html><body style="font-family:'Segoe UI',Arial,sans-serif;background:#f3f4f6;padding:40px;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:36px;box-shadow:0 2px 12px rgba(0,0,0,.08);">
    <h2 style="color:#dc2626;">Registration Not Approved</h2>
    <p>Hello <strong>{$name}</strong>,</p>
    <p>Unfortunately your FEMS registration could not be approved at this time. Please contact your administrator for more information.</p>
  </div>
</body></html>
HTML;
        }

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
        $body = <<<HTML
<!DOCTYPE html><html><body style="font-family:'Segoe UI',Arial,sans-serif;background:#f3f4f6;padding:40px;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:36px;box-shadow:0 2px 12px rgba(0,0,0,.08);">
    <h2 style="color:#111827;">Order Update</h2>
    <p>Your order <strong>#{$orderId}</strong> has been <strong>{$label}</strong>.</p>
HTML;
        if ($grantedQty !== null && $orderedQty !== null && $status === 'partially_granted') {
            $body .= '<p><strong>Approved:</strong> ' . (int) $grantedQty . ' of ' . (int) $orderedQty . ' units. A new pending order was created for the remainder.</p>';
        }
        if ($deliveryDate) {
            $body .= '<p><strong>Expected delivery:</strong> ' . htmlspecialchars($deliveryDate) . '</p>';
        }
        if ($reason) {
            $body .= '<p><strong>Reason:</strong> ' . htmlspecialchars($reason) . '</p>';
        }
        $body .= <<<HTML
    <div style="text-align:center;margin:24px 0;">
      <a href="http://localhost:4200/my-orders" style="background:#1d4ed8;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:600;">Track Order</a>
    </div>
  </div>
</body></html>
HTML;
        return self::sendEmail($email, $subject, $body);
    }

    public static function sendExpirationAlert(string $email, array $extinguisher): bool
    {
        $serial = htmlspecialchars($extinguisher['serial_number'] ?? 'N/A');
        $subject = 'Alert: Fire Extinguisher Expired';
        $body = <<<HTML
<!DOCTYPE html><html><body style="font-family:'Segoe UI',Arial,sans-serif;background:#f3f4f6;padding:40px;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:36px;box-shadow:0 2px 12px rgba(0,0,0,.08);">
    <h2 style="color:#dc2626;">⚠️ Extinguisher Expired</h2>
    <p>Fire extinguisher with serial number <strong>{$serial}</strong> has expired and requires immediate attention.</p>
  </div>
</body></html>
HTML;
        return self::sendEmail($email, $subject, $body);
    }
}
