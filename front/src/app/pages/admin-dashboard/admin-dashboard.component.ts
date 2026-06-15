import { Component, AfterViewInit, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { DashboardService } from '../../services/dashboard.service';
import { AuthService } from '../../auth.service';
import { BarChartComponent } from '../../shared/charts/bar-chart.component';
import { DonutChartComponent } from '../../shared/charts/donut-chart.component';
import { HorizontalBarChartComponent } from '../../shared/charts/h-bar-chart.component';
import { ChartCardComponent } from '../../shared/charts/chart-card.component';
import { ChartSegment, toChartSegments, stockLabel } from '../../shared/charts/chart.models';
import { PaginationComponent } from '../../shared/pagination/pagination.component';

declare const lucide: { createIcons: () => void } | undefined;

interface QuickAction {
  title: string;
  description: string;
  route: string;
  queryParams?: Record<string, string>;
  icon: string;
  accent: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, PaginationComponent, BarChartComponent, DonutChartComponent, ChartCardComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css',
})
export class AdminDashboardComponent implements AfterViewInit, OnInit {
  private orderService = inject(OrderService);
  private dashboard = inject(DashboardService);
  private authService = inject(AuthService);

  userName = 'Admin';
  loading = true;
  stats = {
    pendingOrders: 0,
    pendingClients: 0,
    inStock: 0,
    ordersGranted: 0,
  };
  stockByType: { type: string; capacity?: string; count: number }[] = [];
  orderChart: ChartSegment[] = [];
  stockChart: ChartSegment[] = [];
  orders: any[] = [];
  page = 1;
  lastPage = 1;
  total = 0;
  approvingId: number | null = null;

  quickActions: QuickAction[] = [
    {
      title: 'Review orders',
      description: 'Approve or deny pending client requests',
      route: '/admin-orders',
      queryParams: { status: 'pending' },
      icon: 'shopping-bag',
      accent: 'from-orange-500/10 to-orange-600/5 text-orange-600',
    },
    {
      title: 'Client approvals',
      description: 'Review new company registrations',
      route: '/clients',
      queryParams: { tab: 'pending' },
      icon: 'user-check',
      accent: 'from-amber-500/10 to-amber-600/5 text-amber-600',
    },
    {
      title: 'Inventory',
      description: 'View stock levels and register units',
      route: '/admin-inventory',
      icon: 'package',
      accent: 'from-blue-500/10 to-blue-600/5 text-blue-600',
    },
    {
      title: 'Register units',
      description: 'Add new extinguishers to warehouse stock',
      route: '/admin-add-extinguisher',
      icon: 'plus-circle',
      accent: 'from-emerald-500/10 to-emerald-600/5 text-emerald-600',
    },
  ];

  ngOnInit() {
    const user = this.authService.getUser();
    if (user?.name) this.userName = user.name.split(' ')[0];

    this.dashboard.getStats().subscribe({
      next: (s) => {
        this.stats.pendingOrders = s.pending_orders ?? 0;
        this.stats.pendingClients = s.pending_clients ?? 0;
        this.stats.inStock = s.extinguishers_in_stock ?? 0;
        this.stats.ordersGranted = s.orders_granted ?? 0;
        this.stockByType = s.stock_by_type ?? [];
        this.orderChart = toChartSegments(s.orders_by_status);
        this.stockChart = toChartSegments(s.stock_by_type, stockLabel);
        this.loading = false;
        this.refreshIcons();
      },
      error: () => {
        this.loading = false;
        this.refreshIcons();
      },
    });

    this.loadOrders(1);
  }

  loadOrders(page: number) {
    this.page = page;
    this.orderService.getOrders(page, 6).subscribe({
      next: (res) => {
        this.orders = res.data ?? res ?? [];
        this.page = res.page ?? page;
        this.lastPage = res.last_page ?? 1;
        this.total = res.total ?? this.orders.length;
        this.refreshIcons();
      },
    });
  }

  approveOrder(id: number) {
    this.approvingId = id;
    this.orderService.approveOrder(id).subscribe({
      next: () => {
        this.approvingId = null;
        this.loadOrders(this.page);
        this.dashboard.getStats().subscribe((s) => {
          this.stats.pendingOrders = s.pending_orders ?? 0;
          this.stats.ordersGranted = s.orders_granted ?? 0;
        });
      },
      error: () => {
        this.approvingId = null;
      },
    });
  }

  denyOrder(id: number) {
    this.orderService.denyOrder(id, 'Denied from dashboard').subscribe(() => {
      this.loadOrders(this.page);
      this.dashboard.getStats().subscribe((s) => {
        this.stats.pendingOrders = s.pending_orders ?? 0;
      });
    });
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      pending: 'Pending',
      granted: 'Approved',
      cancelled: 'Denied',
      delivered: 'Delivered',
    };
    return map[status] ?? status;
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      pending: 'bg-amber-50 text-amber-700 ring-amber-200/60',
      granted: 'bg-emerald-50 text-emerald-700 ring-emerald-200/60',
      cancelled: 'bg-red-50 text-red-700 ring-red-200/60',
      delivered: 'bg-sky-50 text-sky-700 ring-sky-200/60',
    };
    return map[status] ?? 'bg-slate-50 text-slate-600 ring-slate-200/60';
  }

  greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  ngAfterViewInit() {
    this.refreshIcons();
  }

  private refreshIcons() {
    setTimeout(() => lucide?.createIcons?.(), 0);
    setTimeout(() => lucide?.createIcons?.(), 120);
  }
}
