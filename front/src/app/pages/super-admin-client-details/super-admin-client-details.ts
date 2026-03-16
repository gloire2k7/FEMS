import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink, RouterLinkActive } from '@angular/router';

declare const lucide: any;

@Component({
    selector: 'app-super-admin-client-details',
    standalone: true,
    imports: [CommonModule, RouterModule, RouterLink, RouterLinkActive],
    templateUrl: './super-admin-client-details.html',
    styleUrl: './super-admin-client-details.css'
})
export class SuperAdminClientDetails implements AfterViewInit {
    locations = [
        { name: 'Main Office HQ', subtitle: 'Floor 1-4', units: 120, risk: 'Low', riskColor: 'text-green-600 bg-green-100', lastInspection: 'Oct 20, 2023', status: 'Compliant', statusColor: 'text-green-500' },
        { name: 'Warehouse B', subtitle: 'Loading Bay Area', units: 85, risk: 'High', riskColor: 'text-red-600 bg-red-100', lastInspection: 'Sep 15, 2023', status: 'Refill Req.', statusColor: 'text-amber-500' },
        { name: 'Server Data Center', subtitle: 'Basement Level', units: 45, risk: 'Medium', riskColor: 'text-amber-600 bg-amber-100', lastInspection: 'Oct 01, 2023', status: 'Compliant', statusColor: 'text-green-500' },
        { name: 'Retail Outlet #4', subtitle: 'Downtown', units: 22, risk: 'Low', riskColor: 'text-green-600 bg-green-100', lastInspection: 'Aug 12, 2023', status: 'Overdue', statusColor: 'text-red-500' }
    ];

    activities = [
        { time: 'Today, 09:41 AM', title: 'Inspection Completed', desc: 'Location: Warehouse B • Inspector: M. Scott', dot: 'border-[#3ce0a3]' },
        { time: 'Yesterday, 02:30 PM', title: 'Label Generated', desc: 'Unit ID: #EXT-2023-89 • Type: CO2', dot: 'border-[#1b346d]' }
    ];

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
        [100, 300, 600].forEach(d => setTimeout(run, d));
    }
}
