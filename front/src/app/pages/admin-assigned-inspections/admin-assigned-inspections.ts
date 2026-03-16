import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';

declare const lucide: { createIcons: (opts?: { nameAttr?: string }) => void } | undefined;

@Component({
    selector: 'app-admin-assigned-inspections',
    standalone: true,
    imports: [CommonModule, RouterModule, RouterLink, RouterLinkActive, FormsModule],
    templateUrl: './admin-assigned-inspections.html',
    styleUrl: './admin-assigned-inspections.css',
})
export class AdminAssignedInspections implements AfterViewInit {
    inspectionsOpen = true;

    constructor(private router: Router) { }

    approveInspection() {
        this.router.navigate(['/admin-inventory']);
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
        [100, 300, 600, 1000, 2000].forEach((delay) => {
            setTimeout(run, delay);
        });
    }

    inspections = [
        {
            id: 'EXT-2023-89',
            location: 'Building A, Floor 2, Corridor',
            inspector: 'Sarah Jenkins',
            avatar: null,
            date: 'Oct 24, 2023',
            status: 'Passed',
            statusColor: 'bg-green-50 text-green-600 border-green-100'
        },
        {
            id: 'EXT-2023-42',
            location: 'Warehouse Zone B, Rack 4',
            inspector: 'Mike Ross',
            avatar: 'https://ui-avatars.com/api/?name=Mike+Ross&background=6366f1&color=fff',
            date: 'Oct 23, 2023',
            status: 'Needs Refill',
            statusColor: 'bg-amber-50 text-amber-600 border-amber-100',
            selected: true
        },
        {
            id: 'EXT-2020-11',
            location: 'Cafeteria Kitchen',
            inspector: 'Elena Fisher',
            avatar: 'https://ui-avatars.com/api/?name=Elena+Fisher&background=10b981&color=fff',
            date: 'Oct 22, 2023',
            status: 'Expired',
            statusColor: 'bg-red-50 text-red-600 border-red-100'
        }
    ];

    selectedInspection = {
        id: 'EXT-2023-42',
        pressure: 'Low (100psi)',
        weight: '4.2 kg',
        sealStatus: 'Intact',
        bracketStatus: 'Loose',
        notes: 'Pressure gauge is reading below the green zone. Bracket screws are loose on the wall. Recommended refill and maintenance immediately.',
        inspector: 'Mike Ross',
        date: 'Oct 23, 2023'
    };
}
