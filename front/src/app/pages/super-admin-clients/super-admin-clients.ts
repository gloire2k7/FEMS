import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink, RouterLinkActive } from '@angular/router';

declare const lucide: any;

@Component({
    selector: 'app-super-admin-clients',
    standalone: true,
    imports: [CommonModule, RouterModule, RouterLink, RouterLinkActive],
    templateUrl: './super-admin-clients.html',
    styleUrl: './super-admin-clients.css'
})
export class SuperAdminClients implements AfterViewInit {
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
