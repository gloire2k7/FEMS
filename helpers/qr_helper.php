<?php

class QRHelper
{
    /**
     * Generate QR Code for an extinguisher
     * Requires phpqrcode or similar library
     */
    public static function generate($extinguisherId, $serialNumber)
    {
        // As requested, URL format
        $url = "https://yourdomain.com/extinguisher/view.php?id=" . $extinguisherId;
        $filename = $serialNumber . '.png';
        $path = __DIR__ . '/../uploads/qrcodes/' . $filename;

        // Ensure directory exists
        $dir = dirname($path);
        if (!file_exists($dir)) {
            mkdir($dir, 0777, true);
        }

        // ---
        // INSTRUCTION: If using 'phpqrcode' library, uncomment the following lines
        // after downloading it to your helpers directory:
        // include_once('phpqrcode/qrlib.php');
        // QRcode::png($url, $path, 'L', 4, 2);
        // ---

        // Temporary fallback to Web API for "Real" QR Codes if library is not loaded
        if (!file_exists($path) && !class_exists('QRcode')) {
            $apiUrl = "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=" . urlencode($url);
            $imgData = @file_get_contents($apiUrl);
            if ($imgData) {
                file_put_contents($path, $imgData);
            }
            else {
                // Secondary fallback: dummy placeholder image
                $img = imagecreate(200, 200);
                imagecolorallocate($img, 240, 240, 240); // bg
                $tc = imagecolorallocate($img, 0, 0, 0); // text
                imagestring($img, 3, 20, 90, "QR API Fail: " . $serialNumber, $tc);
                imagepng($img, $path);
                imagedestroy($img);
            }
        }

        return '/uploads/qrcodes/' . $filename;
    }
}
