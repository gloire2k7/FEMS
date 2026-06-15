import { AfterViewInit, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../auth.service';
import { DashboardService } from '../../services/dashboard.service';
import { OrderService } from '../../services/order.service';
import { DonutChartComponent } from '../../shared/charts/donut-chart.component';
import { HorizontalBarChartComponent } from '../../shared/charts/h-bar-chart.component';
import { ChartCardComponent } from '../../shared/charts/chart-card.component';
import { ChartSegment, toChartSegments } from '../../shared/charts/chart.models';

declare const lucide: { createIcons: () => void } | undefined;

interface QuickAction {
  title: string;
  description: string;
  route: string;
  icon: string;
  accent: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, DonutChartComponent, HorizontalBarChartComponent, ChartCardComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent implements OnInit, AfterViewInit {
  private auth = inject(AuthService);
  private dashboard = inject(DashboardService);
  private orders = inject(OrderService);

  userName = 'there';
  companyName = '';
  loading = true;
  stats = {
    myUnits: 0,
    pendingOrders: 0,
    approvedOrders: 0,
    deliveredOrders: 0,
  };
  recentOrders: any[] = [];
  orderChart: ChartSegment[] = [];
  unitsChart: ChartSegment[] = [];

  quickActions: QuickAction[] = [
    {
      title: 'Order extinguishers',
      description: 'Browse available stock and place a request',
      route: '/shop',
      icon: 'shopping-bag',
      accent: 'from-blue-500/10 to-blue-600/5 text-blue-600',
    },
    {
      title: 'Track my orders',
      description: 'See approval and delivery status',
      route: '/my-orders',
      icon: 'package-check',
      accent: 'from-violet-500/10 to-violet-600/5 text-violet-600',
    },
    {
      title: 'My extinguishers',
      description: 'View units assigned to your company',
      route: '/extinguishers',
      icon: 'flame',
      accent: 'from-orange-500/10 to-orange-600/5 text-orange-600',
    },
    {
      title: 'Account settings',
      description: 'Update password and preferences',
      route: '/settings',
      icon: 'settings',
      accent: 'from-slate-500/10 to-slate-600/5 text-slate-600',
    },
  ];

  ngOnInit() {
    const user = this.auth.getUser();
    if (user?.name) {
      this.userName = user.name.split(' ')[0];
    }
    if (user?.company_name) {
      this.companyName = user.company_name;
    }

    this.dashboard.getStats().subscribe({
      next: (s) => {
        this.stats.myUnits = s.my_units ?? 0;
        this.stats.pendingOrders = this.countByStatus(s.orders_by_status, 'pending') || s.pending_orders || 0;
        this.stats.approvedOrders = this.countByStatus(s.orders_by_status, 'granted');
        this.stats.deliveredOrders = this.countByStatus(s.orders_by_status, 'delivered');
        this.orderChart = toChartSegments(s.orders_by_status);
        this.unitsChart = toChartSegments(s.units_by_type);
        this.loading = false;
        this.refreshIcons();
      },
      error: () => {
        this.loading = false;
        this.refreshIcons();
      },
    });

    this.orders.getOrders(1, 5).subscribe({
      next: (res) => {
        this.recentOrders = res.data ?? res ?? [];
        this.refreshIcons();
      },
    });
  }

  ngAfterViewInit() {
    this.refreshIcons();
  }

  countByStatus(rows: { status: string; count: number }[] | undefined, status: string): number {
    if (!rows) return 0;
    const row = rows.find((r) => r.status === status);
    return row ? Number(row.count) : 0;
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      pending: 'Pending review',
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

  private refreshIcons() {
    setTimeout(() => lucide?.createIcons?.(), 0);
    setTimeout(() => lucide?.createIcons?.(), 120);
  }
}
