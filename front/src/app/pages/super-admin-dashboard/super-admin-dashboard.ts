import { Component, AfterViewInit, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../auth.service';
import { DashboardService } from '../../services/dashboard.service';

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
  selector: 'app-super-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './super-admin-dashboard.html',
  styleUrls: ['./super-admin-dashboard.css'],
})
export class SuperAdminDashboard implements AfterViewInit, OnInit {
  private authService = inject(AuthService);
  private dashboard = inject(DashboardService);
  private router = inject(Router);

  userName = 'Super Admin';
  loading = true;
  stats: any = {};
  stockByType: { type: string; capacity?: string; count: number }[] = [];
  ordersByStatus: { status: string; count: number }[] = [];
  alerts: { title: string; subtitle: string; type: string; icon: string; route: string; queryParams?: Record<string, string> }[] = [];

  quickActions: QuickAction[] = [
    {
      title: 'Create admin',
      description: 'Grant platform access with permissions',
      route: '/super-admin-add-admin',
      icon: 'user-plus',
      accent: 'from-violet-500/10 to-violet-600/5 text-violet-600',
    },
    {
      title: 'Review clients',
      description: 'Approve pending company registrations',
      route: '/super-admin-clients',
      queryParams: { tab: 'pending' },
      icon: 'building-2',
      accent: 'from-amber-500/10 to-amber-600/5 text-amber-600',
    },
    {
      title: 'Manage admins',
      description: 'View and update administrator accounts',
      route: '/super-admin-admins',
      icon: 'shield',
      accent: 'from-blue-500/10 to-blue-600/5 text-blue-600',
    },
    {
      title: 'Generate reports',
      description: 'Export inventory and compliance data',
      route: '/super-admin-reports',
      icon: 'file-bar-chart',
      accent: 'from-emerald-500/10 to-emerald-600/5 text-emerald-600',
    },
  ];

  ngOnInit() {
    const user = this.authService.getUser();
    if (user?.name) this.userName = user.name;

    this.dashboard.getStats().subscribe({
      next: (s) => {
        this.stats = s;
        this.stockByType = (s.stock_by_type || []).slice(0, 6);
        this.ordersByStatus = s.orders_by_status || [];
        this.alerts = [];
        if (s.pending_clients > 0) {
          this.alerts.push({
            title: 'Clients awaiting approval',
            subtitle: `${s.pending_clients} registration${s.pending_clients > 1 ? 's' : ''} need review`,
            type: 'warning',
            icon: 'user-plus',
            route: '/super-admin-clients',
            queryParams: { tab: 'pending' },
          });
        }
        if (s.pending_orders > 0) {
          this.alerts.push({
            title: 'Pending orders',
            subtitle: `${s.pending_orders} order${s.pending_orders > 1 ? 's' : ''} awaiting admin action`,
            type: 'info',
            icon: 'shopping-bag',
            route: '/admin-orders',
            queryParams: { status: 'pending' },
          });
        }
        this.loading = false;
        this.refreshIcons();
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  maxOrderCount(): number {
    const max = Math.max(...this.ordersByStatus.map(o => o.count), 1);
    return max;
  }

  barHeight(count: number): number {
    return Math.max(8, (count / this.maxOrderCount()) * 100);
  }

  ngAfterViewInit() {
    this.refreshIcons();
  }

  private refreshIcons() {
    setTimeout(() => lucide?.createIcons?.(), 0);
    setTimeout(() => lucide?.createIcons?.(), 120);
  }
}
