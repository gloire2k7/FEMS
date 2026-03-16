import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';

declare const lucide: { createIcons: (opts?: { nameAttr?: string }) => void } | undefined;

export interface AdminInspector {
    id: string;
    name: string;
    email: string;
    phone: string;
    base: string;
    status: 'Active' | 'Inactive';
    availability: 'Available' | 'Busy' | 'On Leave';
    totalInspections: number;
    completionRate: number;
    avatar: string;
    recentActivity: { label: string; result?: string; client?: string; datetime?: string }[];
}

@Component({
    selector: 'app-admin-inspectors',
    standalone: true,
    imports: [CommonModule, RouterModule, RouterLink, RouterLinkActive, FormsModule],
    templateUrl: './admin-inspectors.html',
    styleUrl: './admin-inspectors.css',
})
export class AdminInspectors implements AfterViewInit {

    inspectionsOpen = true;
    searchTerm = '';
    selectedInspector: AdminInspector | null = null;

    inspectors: AdminInspector[] = [
        {
            id: 'INS-1024', name: 'John Doe',
            email: 'john.d@fems.com', phone: '+1 (555) 012-3456',
            base: 'Central District Base', status: 'Active', availability: 'Available',
            totalInspections: 210, completionRate: 95,
            avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=6366f1&color=fff',
            recentActivity: [
                { label: 'Completed Inspection', result: 'Passed', client: 'MegaCorp HQ – Ext #1200', datetime: 'Oct 21, 2023 • 10:00 AM' },
                { label: 'Assigned New Task' }
            ]
        },
        {
            id: 'INS-1025', name: 'Sarah Smith',
            email: 'sarah.s@fems.com', phone: '+1 (555) 987-6543',
            base: 'North District Base', status: 'Active', availability: 'Available',
            totalInspections: 142, completionRate: 98,
            avatar: 'https://ui-avatars.com/api/?name=Sarah+Smith&background=10b981&color=fff',
            recentActivity: [
                { label: 'Completed Inspection', result: 'Passed', client: 'TechCorp HQ – Ext #4459', datetime: 'Oct 22, 2023 • 2:30 PM' },
                { label: 'Assigned New Task' }
            ]
        },
        {
            id: 'INS-1042', name: 'Michael Brown',
            email: 'm.brown@fems.com', phone: '+1 (555) 333-2222',
            base: 'East District Base', status: 'Inactive', availability: 'On Leave',
            totalInspections: 87, completionRate: 78,
            avatar: 'https://ui-avatars.com/api/?name=Michael+Brown&background=f59e0b&color=fff',
            recentActivity: [
                { label: 'Inspection Flagged', result: 'Failed', client: 'Warehouse Zone B', datetime: 'Oct 18, 2023 • 9:15 AM' },
            ]
        },
        {
            id: 'INS-1088', name: 'Emily Davis',
            email: 'e.davis@fems.com', phone: '+1 (555) 888-9999',
            base: 'South District Base', status: 'Active', availability: 'Busy',
            totalInspections: 176, completionRate: 91,
            avatar: 'https://ui-avatars.com/api/?name=Emily+Davis&background=e44d26&color=fff',
            recentActivity: [
                { label: 'Completed Inspection', result: 'Passed', client: 'City Hall – Ext #0011', datetime: 'Oct 23, 2023 • 1:00 PM' },
                { label: 'Assigned New Task' }
            ]
        }
    ];

    get filteredInspectors() {
        if (!this.searchTerm) return this.inspectors;
        const t = this.searchTerm.toLowerCase();
        return this.inspectors.filter(i =>
            i.name.toLowerCase().includes(t) ||
            i.id.toLowerCase().includes(t) ||
            i.email.toLowerCase().includes(t)
        );
    }

    get totalActive() { return this.inspectors.filter(i => i.status === 'Active').length; }
    get totalAvailable() { return this.inspectors.filter(i => i.availability === 'Available').length; }

    selectInspector(inspector: AdminInspector) {
        this.selectedInspector = inspector;
        setTimeout(() => this.initIcons(), 50);
    }

    closePanel() { this.selectedInspector = null; }

    toggleInspections() {
        this.inspectionsOpen = !this.inspectionsOpen;
        this.initIcons();
    }

    ngAfterViewInit() { this.initIcons(); }

    private initIcons() {
        const run = () => {
            if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
        };
        run();
        [100, 300, 600, 1000, 2000].forEach(d => setTimeout(run, d));
    }

    getStatusClass(status: string) {
        return status === 'Active'
            ? 'bg-emerald-100 text-emerald-600'
            : 'bg-slate-100 text-slate-500';
    }

    getAvailClass(av: string) {
        if (av === 'Available') return 'bg-blue-100 text-blue-600';
        if (av === 'Busy') return 'bg-amber-100 text-amber-600';
        return 'bg-red-100 text-red-500';
    }
}
