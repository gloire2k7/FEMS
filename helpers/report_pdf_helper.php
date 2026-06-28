<?php

require_once __DIR__ . '/pdf_branding_helper.php';

class ReportPDFHelper
{
    /**
     * Generate a branded tabular PDF report.
     */
    public static function generate($title, $headers, $data, ?string $dateRange = null)
    {
        $fpdfPath = __DIR__ . '/fpdf.php';
        if (!file_exists($fpdfPath)) {
            return null;
        }

        require_once $fpdfPath;

        $rows = PdfBrandingHelper::normalizeRows($data);
        $count = max(1, count($headers));
        $colWidth = 277 / $count;
        $margin = 10;
        $pageBottom = 185;

        $pdf = new FPDF('L', 'mm', 'A4');
        $pdf->SetMargins($margin, $margin, $margin);
        $pdf->SetAutoPageBreak(true, 18);
        $pdf->AddPage();

        $y = PdfBrandingHelper::drawReportHeader($pdf, $title, $dateRange);
        $y = PdfBrandingHelper::drawReportTableHeader($pdf, $headers, $colWidth, $y);

        $pdf->SetFont('Helvetica', '', 9);
        $rowIndex = 0;

        foreach ($rows as $row) {
            if ($y > $pageBottom) {
                PdfBrandingHelper::drawReportFooter($pdf);
                $pdf->AddPage();
                $y = PdfBrandingHelper::drawReportHeader($pdf, $title, $dateRange);
                $y = PdfBrandingHelper::drawReportTableHeader($pdf, $headers, $colWidth, $y);
                $pdf->SetFont('Helvetica', '', 9);
            }

            $fill = ($rowIndex % 2 === 1);
            if ($fill) {
                PdfBrandingHelper::setFill($pdf, PdfBrandingHelper::ROW_ALT);
            } else {
                PdfBrandingHelper::setFill($pdf, PdfBrandingHelper::WHITE);
            }
            PdfBrandingHelper::setText($pdf, PdfBrandingHelper::SLATE_DARK);
            PdfBrandingHelper::setDraw($pdf, PdfBrandingHelper::BORDER);

            $pdf->SetXY($margin, $y);
            foreach ($row as $cell) {
                $text = substr((string) $cell, 0, 48);
                $pdf->Cell($colWidth, 8, $text, 1, 0, 'L', $fill);
            }
            $pdf->Ln();
            $y = $pdf->GetY();
            $rowIndex++;
        }

        if (empty($rows)) {
            PdfBrandingHelper::setText($pdf, PdfBrandingHelper::SLATE);
            $pdf->SetFont('Helvetica', 'I', 10);
            $pdf->SetXY($margin, $y + 4);
            $pdf->Cell(277, 8, 'No records found for this report.', 0, 1, 'C');
        }

        PdfBrandingHelper::drawReportFooter($pdf);

        $filename = preg_replace('/[^a-z0-9_\-]+/i', '_', strtolower($title)) . '_' . date('YmdHis') . '.pdf';
        $path = __DIR__ . '/../uploads/reports/' . $filename;

        if (!file_exists(dirname($path))) {
            mkdir(dirname($path), 0777, true);
        }

        $pdf->Output('F', $path);
        return '/uploads/reports/' . $filename;
    }
}
