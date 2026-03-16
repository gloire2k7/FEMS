<?php

class ReportPDFHelper
{
    /**
     * Generate Tabular PDF Report
     */
    public static function generate($title, $headers, $data)
    {
        $fpdfPath = __DIR__ . '/fpdf.php';
        if (!file_exists($fpdfPath)) {
            die("FPDF Library missing in helpers/fpdf.php");
        }

        require_once($fpdfPath);

        $pdf = new FPDF('L', 'mm', 'A4'); // Landscape A4
        $pdf->AddPage();

        // Title
        $pdf->SetFont('Helvetica', 'B', 20);
        $pdf->Cell(0, 15, $title, 0, 1, 'C');
        $pdf->SetFont('Helvetica', '', 10);
        $pdf->Cell(0, 5, 'Generated on: ' . date('Y-m-d H:i:s'), 0, 1, 'R');
        $pdf->Ln(10);

        // Header
        $pdf->SetFillColor(230, 230, 230);
        $pdf->SetFont('Helvetica', 'B', 11);

        // Calculate dynamic column widths (simple version)
        $count = count($headers);
        $width = 277 / $count; // A4 landscape width is ~297mm - margins

        foreach ($headers as $header) {
            $pdf->Cell($width, 10, $header, 1, 0, 'C', true);
        }
        $pdf->Ln();

        // Data
        $pdf->SetFont('Helvetica', '', 10);
        foreach ($data as $row) {
            // Check if we need a new page
            if ($pdf->GetY() > 180) {
                $pdf->AddPage('L');
                $pdf->SetFillColor(230, 230, 230);
                $pdf->SetFont('Helvetica', 'B', 11);
                foreach ($headers as $header) {
                    $pdf->Cell($width, 10, $header, 1, 0, 'C', true);
                }
                $pdf->Ln();
                $pdf->SetFont('Helvetica', '', 10);
            }

            foreach ($row as $cell) {
                // MultiCell or truncation for long text
                $pdf->Cell($width, 8, substr((string)$cell, 0, 40), 1);
            }
            $pdf->Ln();
        }

        // Footer
        $pdf->SetY(-15);
        $pdf->SetFont('Helvetica', '', 8);
        $pdf->Cell(0, 10, 'Page ' . $pdf->PageNo() . ' - FEMS Reporting System', 0, 0, 'C');

        // Output to file
        $filename = str_replace(' ', '_', strtolower($title)) . '_' . date('YmdHis') . '.pdf';
        $path = __DIR__ . '/../uploads/reports/' . $filename;

        // Ensure directory exists
        if (!file_exists(dirname($path))) {
            mkdir(dirname($path), 0777, true);
        }

        $pdf->Output('F', $path);
        return '/uploads/reports/' . $filename;
    }
}
