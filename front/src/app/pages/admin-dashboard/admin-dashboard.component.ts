import { Component, AfterViewInit, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { DashboardService } from '../../services/dashboard.service';
import { AuthService } from '../../auth.service';
import { PaginationComponent } from '../../shared/pagination/pagination.component';

declare const lucide: { createIcons: (opts?: { nameAttr?: string }) => void } | undefined;

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule, RouterLink, RouterLinkActive, PaginationComponent],
    templateUrl: './admin-dashboard.component.html',
    styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements AfterViewInit, OnInit {
    private orderService = inject(OrderService);
    private dashboard = inject(DashboardService);
    private authService = inject(AuthService);
    private router = inject(Router);

    userName = 'Admin';
    inspectionsOpen = true;
    orders: any[] = [];
    pendingCount = 0;
    stats: any = {};
    page = 1;
    lastPage = 1;
    total = 0;

    ngOnInit() {
        const user = this.authService.getUser();
        if (user?.name) this.userName = user.name;

        if (this.authService.isRole('Super Admin') || this.authService.hasPermission('view_analytics')) {
            this.dashboard.getStats().subscribe(s => {
                this.stats = s;
                this.pendingCount = s.pending_orders || 0;
            });
        }

        if (this.authService.isRole('Super Admin') || this.authService.hasPermission('manage_orders')) {
            this.loadOrders(1);
        }
    }

    loadOrders(page: number) {
        this.page = page;
        this.orderService.getOrders(page, 8).subscribe(res => {
            this.orders = res.data || res;
            this.page = res.page || 1;
            this.lastPage = res.last_page || 1;
            this.total = res.total || this.orders.length;
            this.pendingCount = this.orders.filter((o: any) => o.status === 'pending').length;
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
        this.orderService.approveOrder(id).subscribe(() => this.loadOrders(this.page));
    }

    denyOrder(id: number) {
        this.orderService.denyOrder(id, 'Denied by admin').subscribe(() => this.loadOrders(this.page));
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
