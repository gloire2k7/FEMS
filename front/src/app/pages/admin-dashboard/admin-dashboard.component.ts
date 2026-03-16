import { Component, AfterViewInit, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink, RouterLinkActive } from '@angular/router';
import { OrderService } from '../../services/order.service';

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
    inspectionsOpen = true;
    orders: any[] = [];
    pendingCount = 0;

    ngOnInit() {
        this.orderService.getOrders().subscribe(orders => {
            this.orders = orders;
            this.pendingCount = orders.filter((o: any) => o.status === 'pending').length;
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
