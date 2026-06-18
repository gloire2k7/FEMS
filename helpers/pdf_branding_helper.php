<?php

/**
 * Shared Codebridge / FEMS branding for PDF and CSV exports.
 */
class PdfBrandingHelper
{
    public const COMPANY_NAME = 'Codebridge Fire Tech Solutions';
    public const PRODUCT_NAME = 'FEMS';
    public const TAGLINE = 'Fire Extinguisher Management System';

    /** #0B1437 */
    public const NAVY = [11, 20, 55];
    public const NAVY_LIGHT = [30, 41, 82];
    public const WHITE = [255, 255, 255];
    public const SLATE = [100, 116, 139];
    public const SLATE_DARK = [51, 65, 85];
    public const ROW_ALT = [248, 250, 252];
    public const BORDER = [226, 232, 240];
    public const RED = [220, 38, 38];
    public const AMBER = [245, 158, 11];

    public static function logoPath(): ?string
    {
        foreach ([
            __DIR__ . '/../uploads/branding/codebridge-logo.jpg',
            __DIR__ . '/../LOGO_cd0ggp.jpg',
        ] as $path) {
            if (is_readable($path)) {
                return $path;
            }
        }
        return null;
    }

    public static function setFill(FPDF $pdf, array $rgb): void
    {
        $pdf->SetFillColor($rgb[0], $rgb[1], $rgb[2]);
    }

    public static function setText(FPDF $pdf, array $rgb): void
    {
        $pdf->SetTextColor($rgb[0], $rgb[1], $rgb[2]);
    }

    public static function setDraw(FPDF $pdf, array $rgb): void
    {
        $pdf->SetDrawColor($rgb[0], $rgb[1], $rgb[2]);
    }

    /** Draw navy header band with logo; returns Y position below header. */
    public static function drawLabelHeader(FPDF $pdf, float $x, float $y, float $w): float
    {
        $h = 26;
        self::setFill($pdf, self::NAVY);
        self::setDraw($pdf, self::NAVY);
        $pdf->Rect($x, $y, $w, $h, 'F');

        $logo = self::logoPath();
        if ($logo) {
            $pdf->Image($logo, $x + 4, $y + 3, 20, 0);
        }

        $tx = $logo ? $x + 27 : $x + 6;
        self::setText($pdf, self::WHITE);
        $pdf->SetFont('Helvetica', 'B', 7);
        $pdf->SetXY($tx, $y + 5);
        $pdf->Cell($w - ($tx - $x) - 4, 4, self::COMPANY_NAME, 0, 1, 'L');
        $pdf->SetFont('Helvetica', '', 6);
        $pdf->SetX($tx);
        $pdf->Cell($w - ($tx - $x) - 4, 3.5, self::TAGLINE, 0, 1, 'L');
        $pdf->SetFont('Helvetica', 'B', 8);
        $pdf->SetX($tx);
        $pdf->Cell($w - ($tx - $x) - 4, 4, self::PRODUCT_NAME . ' · Unit Label', 0, 1, 'L');

        self::setText($pdf, self::SLATE_DARK);
        return $y + $h + 4;
    }

    public static function drawLabelFooter(FPDF $pdf, float $x, float $y, float $w): void
    {
        self::setFill($pdf, self::NAVY);
        self::setDraw($pdf, self::NAVY);
        $pdf->Rect($x, $y, $w, 10, 'F');
        self::setText($pdf, self::WHITE);
        $pdf->SetFont('Helvetica', '', 6);
        $pdf->SetXY($x, $y + 2.5);
        $pdf->Cell($w, 4, self::COMPANY_NAME . '  ·  Scan QR for unit details', 0, 0, 'C');
    }

    /** Label row: muted label + bold value. */
    public static function drawLabelRow(FPDF $pdf, float $x, float $y, float $labelW, float $valueW, string $label, string $value, int $valueSize = 10): float
    {
        self::setText($pdf, self::SLATE);
        $pdf->SetFont('Helvetica', '', 8);
        $pdf->SetXY($x, $y);
        $pdf->Cell($labelW, 6, $label, 0, 0, 'L');

        self::setText($pdf, self::NAVY);
        $pdf->SetFont('Helvetica', 'B', $valueSize);
        $pdf->SetXY($x + $labelW, $y);
        $pdf->MultiCell($valueW, 6, $value, 0, 'L');

        return $pdf->GetY() + 1;
    }

    /** Report page header (landscape). Returns Y after header. */
    public static function drawReportHeader(FPDF $pdf, string $title, ?string $dateRange = null): float
    {
        $pageW = $pdf->GetPageWidth();
        $margin = 10;
        $contentW = $pageW - 2 * $margin;

        self::setFill($pdf, self::NAVY);
        self::setDraw($pdf, self::NAVY);
        $pdf->Rect(0, 0, $pageW, 32, 'F');

        $logo = self::logoPath();
        if ($logo) {
            $pdf->Image($logo, $margin, 5, 28, 0);
        }

        $tx = $logo ? $margin + 32 : $margin;
        self::setText($pdf, self::WHITE);
        $pdf->SetFont('Helvetica', 'B', 11);
        $pdf->SetXY($tx, 7);
        $pdf->Cell($contentW - ($tx - $margin), 5, self::COMPANY_NAME, 0, 1, 'L');
        $pdf->SetFont('Helvetica', '', 8);
        $pdf->SetX($tx);
        $pdf->Cell($contentW - ($tx - $margin), 4, self::TAGLINE, 0, 1, 'L');

        $pdf->SetFont('Helvetica', 'B', 14);
        $pdf->SetXY($margin, 36);
        self::setText($pdf, self::NAVY);
        $pdf->Cell($contentW * 0.65, 8, $title, 0, 0, 'L');

        $pdf->SetFont('Helvetica', '', 9);
        self::setText($pdf, self::SLATE);
        $meta = 'Generated: ' . date('d M Y, H:i');
        if ($dateRange) {
            $meta .= '  ·  Period: ' . $dateRange;
        }
        $pdf->SetXY($margin, 44);
        $pdf->Cell($contentW, 5, $meta, 0, 1, 'L');

        self::setDraw($pdf, self::BORDER);
        $pdf->Line($margin, 52, $pageW - $margin, 52);

        return 56;
    }

    public static function drawReportTableHeader(FPDF $pdf, array $headers, float $colWidth, float $y): float
    {
        $margin = 10;
        self::setFill($pdf, self::NAVY);
        self::setText($pdf, self::WHITE);
        self::setDraw($pdf, self::NAVY_LIGHT);
        $pdf->SetFont('Helvetica', 'B', 9);
        $pdf->SetXY($margin, $y);
        foreach ($headers as $header) {
            $pdf->Cell($colWidth, 9, (string) $header, 1, 0, 'C', true);
        }
        $pdf->Ln();
        return $pdf->GetY();
    }

    public static function drawReportFooter(FPDF $pdf): void
    {
        $pageW = $pdf->GetPageWidth();
        $pdf->SetY(-12);
        self::setDraw($pdf, self::BORDER);
        $pdf->Line(10, $pdf->GetY() - 2, $pageW - 10, $pdf->GetY() - 2);
        self::setText($pdf, self::SLATE);
        $pdf->SetFont('Helvetica', '', 8);
        $pdf->Cell(0, 8, self::COMPANY_NAME . '  ·  ' . self::PRODUCT_NAME . ' Report  ·  Page ' . $pdf->PageNo(), 0, 0, 'C');
    }

    /** Write branded CSV to disk. */
    public static function writeCsvFile(string $fullPath, string $title, array $headers, array $data, ?string $dateRange = null): void
    {
        $dir = dirname($fullPath);
        if (!is_dir($dir)) {
            mkdir($dir, 0777, true);
        }

        $out = fopen($fullPath, 'w');
        if (!$out) {
            return;
        }

        // UTF-8 BOM for Excel
        fwrite($out, "\xEF\xBB\xBF");

        fputcsv($out, [self::COMPANY_NAME]);
        fputcsv($out, [self::PRODUCT_NAME . ' — ' . self::TAGLINE]);
        fputcsv($out, ['Report', $title]);
        fputcsv($out, ['Generated', date('Y-m-d H:i:s')]);
        if ($dateRange) {
            fputcsv($out, ['Period', $dateRange]);
        }
        fputcsv($out, []);
        fputcsv($out, $headers);

        foreach ($data as $row) {
            fputcsv($out, is_array($row) ? array_values($row) : [$row]);
        }

        fputcsv($out, []);
        fputcsv($out, ['— End of report —', self::COMPANY_NAME]);

        fclose($out);
    }

    public static function normalizeRows(array $data): array
    {
        return array_map(static function ($row) {
            return is_array($row) ? array_values($row) : [$row];
        }, $data);
    }
}
