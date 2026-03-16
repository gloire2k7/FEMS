import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';

declare const lucide: { createIcons: (opts?: { nameAttr?: string }) => void } | undefined;

@Component({
    selector: 'app-admin-inventory',
    standalone: true,
    imports: [CommonModule, RouterModule, RouterLink, RouterLinkActive, FormsModule],
    templateUrl: './admin-inventory.html',
    styleUrl: './admin-inventory.css',
})
export class AdminInventoryComponent implements AfterViewInit {

    inspectionsOpen = true;

    constructor(private router: Router) { }

    generateLabel() {
        this.router.navigate(['/admin-inspection-label', 'LE-2023-894']);
    }

    toggleInspections() {
        this.inspectionsOpen = !this.inspectionsOpen;
        this.initIcons();
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
        [100, 300, 600, 1000, 2000].forEach((delay) => setTimeout(run, delay));
    }

    extinguishers = [
        {
            id: 'EXT-2023-001',
            location: 'Main Office, Room 4',
            status: 'Active',
            lastDate: 'Oct 12, 2023',
            nextDate: 'Oct 12, 2024',
            nextDateColor: 'text-orange-500'
        },
        {
            id: 'EXT-2023-045',
            location: 'Warehouse B, Loading Dock',
            status: 'Pending Print',
            lastDate: 'Oct 12, 2023',
            nextDate: 'Oct 12, 2024',
            nextDateColor: 'text-orange-500'
        },
        {
            id: 'EXT-2023-099',
            location: 'Cafeteria, Rear Exit',
            status: 'No label',
            lastDate: '–',
            nextDate: 'Overdue',
            nextDateColor: 'text-red-500'
        },
        {
            id: 'EXT-2023-112',
            location: 'Server Room, Main',
            status: 'Regenerated',
            lastDate: 'Oct 12, 2023',
            nextDate: 'Oct 12, 2024',
            nextDateColor: 'text-orange-500'
        }
    ];

    getStatusClass(status: string): string {
        switch (status) {
            case 'Active': return 'status-active';
            case 'Pending Print': return 'status-pending';
            case 'No label': return 'status-nolabel';
            case 'Regenerated': return 'status-regen';
            default: return 'status-active';
        }
    }
}
