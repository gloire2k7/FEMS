<?php

require_once __DIR__ . '/pdf_branding_helper.php';

class PDFHelper
{
    /**
     * Generate a branded fire extinguisher unit label PDF.
     */
    public static function generateLabel($extinguisherId, $data)
    {
        $filename = 'label_' . $data['serial_number'] . '.pdf';
        $path = __DIR__ . '/../uploads/labels/' . $filename;
        $qrLocalPath = __DIR__ . '/../uploads/qrcodes/' . $data['serial_number'] . '.png';

        $dir = dirname($path);
        if (!file_exists($dir)) {
            mkdir($dir, 0777, true);
        }

        $fpdfPath = __DIR__ . '/fpdf.php';
        if (!file_exists($fpdfPath)) {
            file_put_contents($path, "FPDF missing.\nSerial: " . ($data['serial_number'] ?? ''));
            return '/uploads/labels/' . $filename;
        }

        require_once $fpdfPath;

        // 100 × 150 mm — standard adhesive label size
        $pdf = new FPDF('P', 'mm', [100, 150]);
        $pdf->SetMargins(0, 0, 0);
        $pdf->SetAutoPageBreak(false);
        $pdf->AddPage();

        $mx = 4;
        $my = 4;
        $mw = 92;
        $mh = 142;

        // Outer frame
        PdfBrandingHelper::setDraw($pdf, PdfBrandingHelper::NAVY);
        $pdf->SetLineWidth(0.4);
        $pdf->Rect($mx, $my, $mw, $mh);

        // Header band
        $y = PdfBrandingHelper::drawLabelHeader($pdf, $mx, $my, $mw);

        // Title
        PdfBrandingHelper::setText($pdf, PdfBrandingHelper::NAVY);
        $pdf->SetFont('Helvetica', 'B', 11);
        $pdf->SetXY($mx + 4, $y);
        $pdf->Cell($mw - 8, 7, 'Fire Extinguisher Unit Label', 0, 1, 'C');
        $y = $pdf->GetY() + 2;

        // Serial — prominent
        PdfBrandingHelper::setFill($pdf, PdfBrandingHelper::ROW_ALT);
        PdfBrandingHelper::setDraw($pdf, PdfBrandingHelper::BORDER);
        $pdf->Rect($mx + 4, $y, $mw - 8, 14, 'DF');
        PdfBrandingHelper::setText($pdf, PdfBrandingHelper::SLATE);
        $pdf->SetFont('Helvetica', '', 7);
        $pdf->SetXY($mx + 6, $y + 2);
        $pdf->Cell($mw - 12, 4, 'SERIAL NUMBER', 0, 1, 'C');
        PdfBrandingHelper::setText($pdf, PdfBrandingHelper::NAVY);
        $pdf->SetFont('Helvetica', 'B', 13);
        $pdf->SetX($mx + 6);
        $pdf->Cell($mw - 12, 7, $data['serial_number'] ?? '—', 0, 1, 'C');
        $y = $pdf->GetY() + 4;

        $lx = $mx + 6;
        $labelW = 28;
        $valueW = $mw - 6 - $labelW - 6;

        $y = PdfBrandingHelper::drawLabelRow($pdf, $lx, $y, $labelW, $valueW, 'Type', ucfirst($data['type'] ?? '—') . ' · ' . ($data['capacity'] ?? '—'));
        $y = PdfBrandingHelper::drawLabelRow($pdf, $lx, $y, $labelW, $valueW, 'Client', $data['client_name'] ?? '—', 9);

        // Divider
        PdfBrandingHelper::setDraw($pdf, PdfBrandingHelper::BORDER);
        $pdf->Line($mx + 6, $y + 1, $mx + $mw - 6, $y + 1);
        $y += 5;

        // Dates row
        $half = ($mw - 12) / 2;
        PdfBrandingHelper::setFill($pdf, PdfBrandingHelper::ROW_ALT);
        $pdf->Rect($lx, $y, $half - 2, 16, 'DF');
        PdfBrandingHelper::setText($pdf, PdfBrandingHelper::SLATE);
        $pdf->SetFont('Helvetica', '', 7);
        $pdf->SetXY($lx + 2, $y + 2);
        $pdf->Cell($half - 4, 4, 'FILLED ON', 0, 1, 'L');
        PdfBrandingHelper::setText($pdf, PdfBrandingHelper::NAVY);
        $pdf->SetFont('Helvetica', 'B', 9);
        $pdf->SetX($lx + 2);
        $pdf->Cell($half - 4, 6, $data['filling_date'] ?? '—', 0, 0, 'L');

        $exX = $lx + $half + 2;
        PdfBrandingHelper::setFill($pdf, [254, 242, 242]);
        PdfBrandingHelper::setDraw($pdf, [254, 202, 202]);
        $pdf->Rect($exX, $y, $half - 2, 16, 'DF');
        PdfBrandingHelper::setText($pdf, PdfBrandingHelper::RED);
        $pdf->SetFont('Helvetica', '', 7);
        $pdf->SetXY($exX + 2, $y + 2);
        $pdf->Cell($half - 4, 4, 'EXPIRES ON', 0, 1, 'L');
        $pdf->SetFont('Helvetica', 'B', 9);
        $pdf->SetX($exX + 2);
        $pdf->Cell($half - 4, 6, $data['expiry_date'] ?? '—', 0, 0, 'L');

        $y += 20;

        // QR code
        if (file_exists($qrLocalPath)) {
            $qrSize = 34;
            $qrX = $mx + ($mw - $qrSize) / 2;
            PdfBrandingHelper::setDraw($pdf, PdfBrandingHelper::BORDER);
            $pdf->Rect($qrX - 2, $y - 2, $qrSize + 4, $qrSize + 4);
            $pdf->Image($qrLocalPath, $qrX, $y, $qrSize, $qrSize);
            $y += $qrSize + 6;
        }

        // Footer band
        PdfBrandingHelper::drawLabelFooter($pdf, $mx, $my + $mh - 10, $mw);

        $pdf->Output('F', $path);
        return '/uploads/labels/' . $filename;
    }
}
