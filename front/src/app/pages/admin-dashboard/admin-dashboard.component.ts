import { Component, AfterViewInit, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink, RouterLinkActive } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../auth.service';
import { Router } from '@angular/router';

declare const lucide: { createIcons: (opts?: { nameAttr?: string }) => void } | undefined;

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule, RouterLink, RouterLinkActive],
    templateUrl: './admin-dashboard.component.html',
    styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements AfterViewInit, OnInit {
    private orderService = inject(OrderService);
    private authService = inject(AuthService);
    private router = inject(Router);

    userName: string = 'Admin';
    inspectionsOpen = true;
    orders: any[] = [];
    pendingCount = 0;

    ngOnInit() {
        const user = this.authService.getUser();
        if (user && user.first_name) {
            this.userName = user.first_name;
        }

        this.orderService.getOrders().subscribe(orders => {
            this.orders = orders;
            this.pendingCount = orders.filter((o: any) => o.status === 'pending').length;
        });
    }

    onLogout() {
        this.authService.logout().subscribe({
            next: () => {
                this.authService.clearUser();
                this.router.navigate(['/signin']);
            },
            error: (err: any) => {
                console.error('Logout failed', err);
                this.authService.clearUser();
                this.router.navigate(['/signin']);
            }
        });
    }

    approveOrder(id: number) {
        this.orderService.approveOrder(id).subscribe(() => {
            this.ngOnInit(); // refresh
        });
    }

    denyOrder(id: number) {
        this.orderService.denyOrder(id).subscribe(() => {
            this.ngOnInit(); // refresh
        });
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
        [100, 300, 600, 1000, 2000].forEach(delay => {
            setTimeout(run, delay);
        });
    }
}
