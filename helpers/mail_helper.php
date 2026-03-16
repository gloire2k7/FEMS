<?php

class MailHelper
{
    /**
     * Send email using PHPMailer
     * 
     * @param string $to Email address
     * @param string $subject Email subject
     * @param string $body Email body (HTML)
     */
    public static function sendEmail($to, $subject, $body)
    {
        // ---
        // INSTRUCTION: After installing PHPMailer manually, uncomment and configure:
        // require_once 'PHPMailer/src/Exception.php';
        // require_once 'PHPMailer/src/PHPMailer.php';
        // require_once 'PHPMailer/src/SMTP.php';

        // $mail = new PHPMailer\PHPMailer\PHPMailer(true);
        // try {
        //     $mail->isSMTP();
        //     $mail->Host       = 'smtp.example.com'; 
        //     $mail->SMTPAuth   = true;
        //     $mail->Username   = 'user@example.com';
        //     $mail->Password   = 'secret';
        //     $mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
        //     $mail->Port       = 587;
        //     $mail->setFrom('noreply@yourdomain.com', 'FEMS Admin');
        //     $mail->addAddress($to);
        //     $mail->isHTML(true);
        //     $mail->Subject = $subject;
        //     $mail->Body    = $body;
        //     $mail->send();
        //     return true;
        // } catch (Exception $e) {
        //     error_log("Message could not be sent. Mailer Error: {$mail->ErrorInfo}");
        //     return false;
        // }
        // ---

        // Stub
        error_log("Stub email sent to $to with subject: $subject");
        return true;
    }

    public static function sendExpirationAlert($email, $extinguisher)
    {
        $subject = "Alert: Extinguisher Expired";
        $body = "The fire extinguisher with serial " . $extinguisher['serial_number'] . " has expired. Please inspect immediately.";
        return self::sendEmail($email, $subject, $body);
    }
}
