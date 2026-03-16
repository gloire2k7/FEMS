import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

declare const lucide: { createIcons: (opts?: { nameAttr?: string }) => void } | undefined;

interface RefillRequest {
    id: string;
    extinguisherId: string;
    type: string;
    capacity: string;
    location: string;
    subLocation: string;
    issue: string;
    issueType: 'warning' | 'info' | 'error' | 'success';
    requestDate: string;
    dueDate?: string;
    doneDate?: string;
    status: string;
    statusType: 'pending' | 'in-progress' | 'completed' | 'condemned';
    technician?: {
        name: string;
        avatar: string;
    };
}

@Component({
    selector: 'app-admin-refills',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './admin-refills.html',
    styleUrls: ['./admin-refills.css']
})
export class AdminRefills implements AfterViewInit {
    searchTerm: string = '';
    selectedStatus: string = 'All';
    inspectionsOpen: boolean = false;

    refillRequests: RefillRequest[] = [
        {
            id: '1',
            extinguisherId: 'EXT-00142',
            type: 'CO₂',
            capacity: '5kg',
            location: 'Tech Corp HQ',
            subLocation: 'Server Room B',
            issue: 'Refill Required',
            issueType: 'warning',
            requestDate: 'Oct 24, 2023',
            dueDate: 'Tomorrow',
            status: 'Pending',
            statusType: 'pending'
        },
        {
            id: '2',
            extinguisherId: 'EXT-00892',
            type: 'Dry Powder',
            capacity: '9kg',
            location: 'Westside Warehouse',
            subLocation: 'Loading Dock 4',
            issue: 'Valve Repair',
            issueType: 'info',
            requestDate: 'Oct 22, 2023',
            status: 'In Progress',
            statusType: 'in-progress',
            technician: {
                name: 'Mike R.',
                avatar: 'https://ui-avatars.com/api/?name=Mike+R&background=0D8ABC&color=fff'
            }
        },
        {
            id: '3',
            extinguisherId: 'EXT-00221',
            type: 'Foam',
            capacity: '6L',
            location: 'City Mall',
            subLocation: 'Food Court',
            issue: 'Inspection Failed',
            issueType: 'error',
            requestDate: 'Oct 10, 2023',
            dueDate: 'Overdue: 14 Days',
            status: 'Condemned',
            statusType: 'condemned'
        },
        {
            id: '4',
            extinguisherId: 'EXT-00445',
            type: 'Water',
            capacity: '9L',
            location: 'Office Block A',
            subLocation: 'Lobby',
            issue: 'Routine Check',
            issueType: 'success',
            requestDate: 'Oct 20, 2023',
            doneDate: 'Oct 21',
            status: 'Completed',
            statusType: 'completed',
            technician: {
                name: 'Sarah L.',
                avatar: 'https://ui-avatars.com/api/?name=Sarah+L&background=4CAF50&color=fff'
            }
        }
    ];

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

    toggleInspections() {
        this.inspectionsOpen = !this.inspectionsOpen;
        setTimeout(() => this.initIcons(), 0);
    }

    get filteredRequests() {
        return this.refillRequests.filter(req => {
            const matchesSearch = req.extinguisherId.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                req.location.toLowerCase().includes(this.searchTerm.toLowerCase());
            const matchesStatus = this.selectedStatus === 'All' || req.status === this.selectedStatus;
            return matchesSearch && matchesStatus;
        });
    }
}
