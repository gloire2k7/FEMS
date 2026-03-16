import { Component, AfterViewInit, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

declare const lucide: { createIcons: (opts?: { nameAttr?: string }) => void } | undefined;

@Component({
    selector: 'app-super-admin-reports',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './super-admin-reports.html',
    styleUrls: ['./super-admin-reports.css'],
})
export class SuperAdminReports implements AfterViewInit, OnInit {
    apiUrl = 'http://localhost:8000/api';
    reports: any[] = [];
    totalReports = 0;
    currentPage = 1;
    lastPage = 1;
    loading = false;

    reportForm = {
        type: 'inventory',
        start_date: '',
        end_date: '',
        format: 'pdf'
    };

    confirmationMessage: string | null = null;
    generatedFilePath: string | null = null;

    ngOnInit() {
        this.loadReports();
    }

    async loadReports(page: number = 1) {
        this.loading = true;
        this.currentPage = page;
        try {
            const response = await fetch(`${this.apiUrl}/reports?page=${page}`, {
                credentials: 'include'
            });
            const data = await response.json();
            this.reports = data.reports.map((r: any) => ({
                ...r,
                icon: this.getIconForType(r.type),
                iconClass: this.getIconClassForType(r.type),
                formatIcon: r.format === 'pdf' ? 'file-text' : 'file-spreadsheet',
                formatClass: r.format === 'pdf' ? 'bg-[#EF4444]' : 'bg-[#10B981]'
            }));
            this.totalReports = data.total;
            this.lastPage = data.last_page;
            this.initIcons();
        } catch (error) {
            console.error('Error loading reports:', error);
        } finally {
            this.loading = false;
        }
    }

    async generateReport() {
        this.loading = true;
        this.confirmationMessage = null;
        this.generatedFilePath = null;

        const formData = new FormData();
        formData.append('type', this.reportForm.type);
        formData.append('start_date', this.reportForm.start_date);
        formData.append('end_date', this.reportForm.end_date);
        formData.append('format', this.reportForm.format);

        try {
            const response = await fetch(`${this.apiUrl}/reports`, {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });
            const data = await response.json();
            if (response.ok) {
                this.confirmationMessage = 'Report generated successfully!';
                this.generatedFilePath = data.report.file_path;
                this.loadReports(1);
            } else {
                alert(data.message || 'Error generating report');
            }
        } catch (error) {
            console.error('Error generating report:', error);
            alert('Error generating report');
        } finally {
            this.loading = false;
        }
    }

    async exportAllZip() {
        try {
            const response = await fetch(`${this.apiUrl}/reports/export-zip`, {
                credentials: 'include'
            });
            const data = await response.json();
            if (response.ok) {
                this.downloadFile(data.file_path);
            } else {
                alert(data.message || 'Error exporting ZIP');
            }
        } catch (error) {
            console.error('Error exporting ZIP:', error);
        }
    }

    downloadFile(path: string) {
        if (!path) return;
        const fullUrl = path.startsWith('http') ? path : `http://localhost:8000${path}`;
        window.open(fullUrl, '_blank');
    }

    getIconForType(type: string): string {
        if (type.includes('Inventory')) return 'database';
        if (type.includes('Expired')) return 'trash-2';
        if (type.includes('Inspection')) return 'file-check';
        if (type.includes('Service')) return 'refresh-cw';
        return 'file-text';
    }

    getIconClassForType(type: string): string {
        if (type.includes('Inventory')) return 'bg-blue-500';
        if (type.includes('Expired')) return 'bg-[#EF4444]';
        if (type.includes('Inspection')) return 'bg-[#10B981]';
        if (type.includes('Service')) return 'bg-[#F59E0B]';
        return 'bg-slate-500';
    }

    ngAfterViewInit() {
        this.initIcons();
    }

    private initIcons() {
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
            setTimeout(() => lucide.createIcons(), 100);
            setTimeout(() => lucide.createIcons(), 500);
        }
    }
}
