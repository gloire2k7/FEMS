<?php

class ReportController extends Controller
{
    public function index()
    {
        AuthMiddleware::check();
        $role = $_SESSION['role_name'] ?? '';

        if ($role === 'Inspector') {
            $userId = (int) $_SESSION['user_id'];
            $page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
            $limit = 5;
            $offset = ($page - 1) * $limit;

            $db = Database::getConnection();
            $stmt = $db->prepare("SELECT COUNT(*) FROM generated_reports WHERE user_id = ?");
            $stmt->execute([$userId]);
            $totalReports = $stmt->fetchColumn();

            $stmt = $db->prepare(
                "SELECT * FROM generated_reports WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?"
            );
            $stmt->bindValue(1, $userId, PDO::PARAM_INT);
            $stmt->bindValue(2, $limit, PDO::PARAM_INT);
            $stmt->bindValue(3, $offset, PDO::PARAM_INT);
            $stmt->execute();
            $reports = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $this->jsonResponse([
                "reports" => $reports,
                "total" => $totalReports,
                "page" => $page,
                "last_page" => ceil($totalReports / $limit)
            ]);
            return;
        }

        AuthMiddleware::hasRoleOrPermission(['Super Admin', 'Admin'], 'reports.view');

        $db = Database::getConnection();
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = 5;
        $offset = ($page - 1) * $limit;

        $stmt = $db->prepare("SELECT COUNT(*) FROM generated_reports");
        $stmt->execute();
        $totalReports = $stmt->fetchColumn();

        $stmt = $db->prepare("SELECT * FROM generated_reports ORDER BY created_at DESC LIMIT :limit OFFSET :offset");
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $reports = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $this->jsonResponse([
            "reports" => $reports,
            "total" => $totalReports,
            "page" => $page,
            "last_page" => ceil($totalReports / $limit)
        ]);
    }

    public function generate()
    {
        AuthMiddleware::check();
        $role = $_SESSION['role_name'] ?? '';

        $type = isset($_POST['type']) ? $_POST['type'] : 'inventory';
        $format = isset($_POST['format']) ? $_POST['format'] : 'pdf';
        $startDate = isset($_POST['start_date']) ? $_POST['start_date'] : null;
        $endDate = isset($_POST['end_date']) ? $_POST['end_date'] : null;
        $userId = null;

        if ($role === 'Inspector') {
            if ($type !== 'my_inspections') {
                $this->jsonResponse(["message" => "Inspectors can only generate my_inspections reports"], 403);
            }
            $userId = (int) $_SESSION['user_id'];
        } else {
            AuthMiddleware::hasRoleOrPermission(['Super Admin', 'Admin'], 'reports.generate');
        }

        require_once __DIR__ . '/../helpers/report_pdf_helper.php';
        require_once __DIR__ . '/../helpers/excel_helper.php';

        $db = Database::getConnection();
        $data = [];
        $headers = [];
        $title = "";

        switch ($type) {
            case 'my_inspections':
                $title = "My Inspections Report";
                $headers = ['ID', 'Serial', 'Location', 'Client', 'Result', 'Inspection Date', 'Notes'];
                $assignmentModel = new InspectionAssignment();
                $rows = $assignmentModel->getCompletedForInspector($userId);
                foreach ($rows as $row) {
                    $data[] = [
                        'ID' => $row['id'],
                        'Serial' => $row['serial_number'],
                        'Location' => $row['location_name'] ?? '—',
                        'Client' => $row['company_name'] ?? '—',
                        'Result' => $row['result_status'],
                        'Inspection Date' => $row['inspection_date'],
                        'Notes' => $row['notes'] ?? '',
                    ];
                }
                break;

            case 'inventory':
                $title = "Inventory Report";
                $headers = ['ID', 'Serial', 'Type', 'Capacity', 'Status', 'Client'];
                $where = ($startDate && $endDate)
                    ? "WHERE f.created_at BETWEEN '{$startDate} 00:00:00' AND '{$endDate} 23:59:59'"
                    : '';
                $query = "SELECT f.id, f.serial_number, f.type, f.capacity, f.status, c.company_name
                          FROM fire_extinguishers f
                          LEFT JOIN clients c ON f.client_id = c.id $where ORDER BY f.created_at DESC";
                $stmt = $db->prepare($query);
                $stmt->execute();
                $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
                break;

            case 'orders':
                $title = "Orders Report";
                $headers = ['ID', 'Client', 'Status', 'Total (RWF)', 'Date'];
                $where = ($startDate && $endDate)
                    ? "WHERE o.created_at BETWEEN '{$startDate} 00:00:00' AND '{$endDate} 23:59:59'"
                    : '';
                $query = "SELECT o.id, c.company_name, o.status, o.total_price, DATE(o.created_at) as order_date
                          FROM orders o LEFT JOIN clients c ON o.client_id = c.id
                          $where ORDER BY o.created_at DESC";
                $stmt = $db->prepare($query);
                $stmt->execute();
                $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
                break;

            case 'expired':
                $title = "Expired Extinguisher Report";
                $headers = ['ID', 'Serial', 'Type', 'Capacity', 'Expiry Date', 'Client'];
                $query = "SELECT f.id, f.serial_number, f.type, f.capacity, f.expiry_date, c.company_name 
                          FROM fire_extinguishers f 
                          LEFT JOIN clients c ON f.client_id = c.id 
                          WHERE f.expiry_date < CURDATE()";
                $stmt = $db->prepare($query);
                $stmt->execute();
                $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
                break;

            case 'compliance':
                $title = "Inspection Compliance Report";
                $headers = ['Ext. ID', 'Serial', 'Type', 'Last Inspection', 'Next Due', 'Status'];
                $query = "SELECT f.id, f.serial_number, f.type, MAX(i.inspection_date) as last_insp, i.next_due_date, f.status
                          FROM fire_extinguishers f
                          JOIN inspections i ON f.id = i.extinguisher_id
                          GROUP BY f.id
                          HAVING i.next_due_date < CURDATE() OR i.next_due_date IS NULL";
                $stmt = $db->prepare($query);
                $stmt->execute();
                $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
                break;

            case 'service':
                $title = "Service & Maintenance History";
                $headers = ['Ext. ID', 'Serial', 'Type', 'Service', 'Date', 'Admin'];
                $query = "SELECT f.id, f.serial_number, f.type, m.service_type, m.service_date, u.name 
                          FROM maintenance_records m
                          JOIN fire_extinguishers f ON m.extinguisher_id = f.id
                          JOIN users u ON m.performed_by = u.id";

                if ($startDate && $endDate) {
                    $query .= " WHERE m.service_date BETWEEN :start AND :end";
                }

                $stmt = $db->prepare($query);
                if ($startDate && $endDate) {
                    $stmt->bindParam(':start', $startDate);
                    $stmt->bindParam(':end', $endDate);
                }
                $stmt->execute();
                $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
                break;

            default:
                $this->jsonResponse(["message" => "Invalid report type"], 400);
        }

        $reportName = $title . ($startDate && $endDate ? " - ($startDate to $endDate)" : " - " . date('Y-m-d'));
        $dateRange = ($startDate && $endDate) ? "{$startDate} to {$endDate}" : null;
        $fileName = str_replace([' ', '/', '\\'], '_', strtolower($reportName)) . '_' . time() . '.' . $format;
        $uploadDir = __DIR__ . '/../uploads/reports/';
        
        if (!file_exists($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $fullPath = $uploadDir . $fileName;

        if ($format === 'csv') {
            require_once __DIR__ . '/../helpers/pdf_branding_helper.php';
            PdfBrandingHelper::writeCsvFile($fullPath, $title, $headers, $data, $dateRange);
            $filePath = '/uploads/reports/' . $fileName;
        } else {
            $filePath = ReportPDFHelper::generate($title, $headers, $data, $dateRange);
            $fileName = basename($filePath);
        }

        // Save to DB
        $stmt = $db->prepare("INSERT INTO generated_reports (user_id, name, type, file_path, format, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$userId, $reportName, $title, $filePath, $format, $startDate, $endDate]);
        $reportId = (int) $db->lastInsertId();

        require_once __DIR__ . '/../helpers/audit_helper.php';
        AuditHelper::log('export', 'report', $reportId, $reportName,
            strtoupper($format) . ' report generated');

        $this->jsonResponse([
            "message" => "Report generated successfully",
            "report" => [
                "name" => $reportName,
                "file_path" => $filePath
            ]
        ]);
    }

    public function exportZip()
    {
        AuthMiddleware::hasRoleOrPermission(['Super Admin', 'Admin'], 'reports.export');

        $uploadDir = __DIR__ . '/../uploads/reports/';
        $zipName = 'fems_reports_' . date('Ymd_His') . '.zip';
        $zipPath = $uploadDir . $zipName;

        if (!file_exists($uploadDir)) {
            $this->jsonResponse(["message" => "No reports found"], 404);
        }

        $zip = new ZipArchive();
        if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== TRUE) {
            $this->jsonResponse(["message" => "Could not create ZIP file"], 500);
        }

        $files = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($uploadDir),
            RecursiveIteratorIterator::LEAVES_ONLY
        );

        foreach ($files as $name => $file) {
            if (!$file->isDir()) {
                $filePath = $file->getRealPath();
                $relativePath = substr($filePath, strlen($uploadDir));
                
                // Skip the ZIP itself if it was already partially created
                if (basename($filePath) !== $zipName) {
                    $zip->addFile($filePath, $relativePath);
                }
            }
        }

        $zip->close();

        if (file_exists($zipPath)) {
            require_once __DIR__ . '/../helpers/audit_helper.php';
            AuditHelper::log('export', 'report', null, $zipName, 'Bulk reports ZIP export');
            $this->jsonResponse([
                "message" => "ZIP exported successfully",
                "file_path" => "/uploads/reports/" . $zipName
            ]);
        } else {
            $this->jsonResponse(["message" => "Failed to generate ZIP"], 500);
        }
    }
}
