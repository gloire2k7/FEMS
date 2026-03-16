import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

declare const lucide: { createIcons: (opts?: { nameAttr?: string }) => void } | undefined;

interface ComplianceAlert {
    id: string;
    extinguisherId: string;
    type: string;
    capacity: string;
    location: string;
    urgency: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
    tags: string[];
    isRead: boolean;
    description: string;
    timestamp: string;
    urgencyDetail: string;
    selected?: boolean;
}

@Component({
    selector: 'app-admin-compliance',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './admin-compliance.html',
    styleUrl: './admin-compliance.css'
})
export class AdminCompliance implements OnInit, AfterViewInit {
    inspectionsOpen = true;
    searchTerm = '';

    selectedType = 'All';
    selectedUrgency = 'All';
    selectedStatus = 'All';

    alerts: ComplianceAlert[] = [
        {
            id: '1',
            extinguisherId: 'EXT-00142',
            type: 'CO₂',
            capacity: '5kg',
            location: 'Tech Corp HQ - Server Room B',
            urgency: 'URGENT',
            tags: ['URGENT', 'EXPIRED', 'Unread'],
            isRead: false,
            description: 'Critical Safety Alert: This extinguisher has exceeded its certification period by 45 days. Immediate replacement or recertification required to maintain safety compliance.',
            timestamp: 'Oct 28, 2023 - 09:15 AM',
            urgencyDetail: 'Expired: 45 days ago'
        },
        {
            id: '2',
            extinguisherId: 'EXT-00892',
            type: 'Dry Powder',
            capacity: '9kg',
            location: 'Westside Warehouse - Loading Dock 4',
            urgency: 'HIGH',
            tags: ['HIGH', 'INSPECTION DUE', 'Unread'],
            isRead: false,
            description: 'Annual safety inspection is overdue by 12 days. Schedule inspection immediately to avoid compliance violations and ensure operational safety standards.',
            timestamp: 'Oct 27, 2023 - 02:30 PM',
            urgencyDetail: 'Due: 12 days overdue'
        },
        {
            id: '3',
            extinguisherId: 'EXT-00556',
            type: 'Foam',
            capacity: '6L',
            location: 'City Mall - Food Court',
            urgency: 'MEDIUM',
            tags: ['MEDIUM', 'REFILL REQUIRED', 'Read'],
            isRead: true,
            description: 'Pressure gauge indicates low pressure. Refill scheduled for next week. Technician assignment pending approval.',
            timestamp: 'Oct 26, 2023 - 11:45 AM',
            urgencyDetail: 'Scheduled: Nov 2, 2023'
        },
        {
            id: '4',
            extinguisherId: 'EXT-00221',
            type: 'CO₂',
            capacity: '2kg',
            location: 'Downtown Plaza - Sector 4',
            urgency: 'HIGH',
            tags: ['HIGH', 'MULTIPLE ISSUES', 'Unread'],
            isRead: false,
            description: 'This unit has both a pending inspection and partial pressure loss. Immediate onsite evaluation is recommended.',
            timestamp: 'Oct 25, 2023 - 03:20 PM',
            urgencyDetail: 'Multiple compliance failures'
        }
    ];

    ngOnInit() { }

    ngAfterViewInit() {
        this.initIcons();
    }

    private initIcons() {
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
            // Retry twice to ensure all dynamic elements are captured
            setTimeout(() => lucide.createIcons(), 100);
            setTimeout(() => lucide.createIcons(), 500);
        }
    }

    toggleInspections() {
        this.inspectionsOpen = !this.inspectionsOpen;
        setTimeout(() => this.initIcons(), 0);
    }

    get filteredAlerts() {
        return this.alerts.filter(alert => {
            const matchesSearch = alert.extinguisherId.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                alert.location.toLowerCase().includes(this.searchTerm.toLowerCase());
            const matchesType = this.selectedType === 'All' || alert.tags.includes(this.selectedType.toUpperCase());
            const matchesUrgency = this.selectedUrgency === 'All' || alert.urgency === this.selectedUrgency.toUpperCase();

            return matchesSearch && matchesType && matchesUrgency;
        });
    }

    get selectedCount() {
        return this.alerts.filter(a => a.selected).length;
    }

    selectAll(event: any) {
        const checked = event.target.checked;
        this.alerts.forEach(a => a.selected = checked);
    }

    toggleSelect(alert: ComplianceAlert) {
        alert.selected = !alert.selected;
    }
}
