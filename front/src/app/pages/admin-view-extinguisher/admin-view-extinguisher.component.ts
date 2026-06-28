import { Component, OnInit, AfterViewInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ExtinguisherService } from '../../services/extinguisher.service';

declare const lucide: { createIcons: (opts?: { nameAttr?: string }) => void } | undefined;

@Component({
    selector: 'app-admin-view-extinguisher',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './admin-view-extinguisher.component.html',
    styleUrls: ['./admin-view-extinguisher.component.css']
})
export class AdminViewExtinguisherComponent implements OnInit, AfterViewInit {
    private extinguisherService = inject(ExtinguisherService);
    private route = inject(ActivatedRoute);
    private cdr = inject(ChangeDetectorRef);

    inspectionsOpen = true;
    isLoading = false;
    errorMessage = '';
    extinguisher: any = null;

    toggleInspections() {
        this.inspectionsOpen = !this.inspectionsOpen;
        this.initIcons();
    }

    ngOnInit() {
        this.route.paramMap.subscribe(params => {
            const id = params.get('id');
            if (id) {
                this.loadExtinguisher(id);
            }
        });
    }

    loadExtinguisher(id: string) {
        this.isLoading = true;
        this.extinguisherService.getExtinguisher(id).subscribe({
            next: (data) => {
                this.extinguisher = data;
                this.isLoading = false;
                this.cdr.detectChanges();
                this.initIcons();
            },
            error: (err) => {
                this.errorMessage = err.error?.message || 'Extinguisher not found.';
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    ngAfterViewInit() {
        this.initIcons();
    }

    private initIcons() {
        const run = () => {
            if (typeof lucide !== 'undefined' && lucide.createIcons) {
                lucide.createIcons();
            }
        };
        run();
        [100, 300, 600, 1000, 2000].forEach(delay => {
            setTimeout(run, delay);
        });
    }

    maintenanceHistory: any[] = []; // Currently empty, but can be populated if backend supports it.

    activityLog = [
        { height: '40%' },
        { height: '65%' },
        { height: '45%' },
        { height: '85%' }
    ];

    getStatusClass(status: string) {
        switch (status?.toLowerCase()) {
            case 'filled':
            case 'passed': return 'status-passed';
            case 'expired':
            case 'condemned': return 'status-expired';
            default: return 'status-almost';
        }
    }

    getStatusColor(status: string) {
        switch (status?.toLowerCase()) {
            case 'filled':
            case 'passed': return '#059669';
            case 'expired':
            case 'condemned': return '#DC2626';
            default: return '#D97706';
        }
    }

    downloadLabel() {
        if (this.extinguisher?.label_pdf_path) {
            window.open(`http://localhost:8000${this.extinguisher.label_pdf_path}`, '_blank');
        }
    }
}
