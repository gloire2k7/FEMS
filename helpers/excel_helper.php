<?php

class ExcelHelper
{
    /**
     * Download data as CSV (compatible with Excel)
     */
    public static function downloadCsv($filename, $headers, $data)
    {
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename=' . $filename);

        $output = fopen('php://output', 'w');

        // Output headers
        fputcsv($output, $headers);

        // Output data rows
        foreach ($data as $row) {
            fputcsv($output, $row);
        }

        fclose($output);
        exit;
    }
}
