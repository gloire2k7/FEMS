import { AfterViewInit, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../auth.service';
import { DashboardService } from '../../services/dashboard.service';
import { InspectionService } from '../../services/inspection.service';
import { OrderService } from '../../services/order.service';
import { DonutChartComponent } from '../../shared/charts/donut-chart.component';
import { HorizontalBarChartComponent } from '../../shared/charts/h-bar-chart.component';
import { ChartCardComponent } from '../../shared/charts/chart-card.component';
import { ChartSegment, toChartSegments, stockLabel } from '../../shared/charts/chart.models';

declare const lucide: { createIcons: () => void } | undefined;

interface StatCard {
  label: string;
  value: number;
  hint: string;
  icon: string;
  accent: string;
  route: string;
  queryParams?: Record<string, string>;
  show: boolean;
}

interface QuickAction {
  title: string;
  route: string;
  queryParams?: Record<string, string>;
  icon: string;
  accent: string;
  show: boolean;
}

interface DashAlert {
  title: string;
  subtitle: string;
  icon: string;
  tone: string;
  route: string;
  queryParams?: Record<string, string>;
}

@Component({
  selector: 'app-unified-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, DonutChartComponent, HorizontalBarChartComponent, ChartCardComponent],
  templateUrl: './unified-dashboard.component.html',
})
export class UnifiedDashboardComponent implements OnInit, AfterViewInit {
  private auth = inject(AuthService);
  private dashboard = inject(DashboardService);
  private inspections = inject(InspectionService);
  private orders = inject(OrderService);

  userName = 'there';
  companyName = '';
  loading = true;

  raw: any = {};
  myApproved = 0;
  myDelivered = 0;
  inspectorStats = { pool: 0, assigned: 0, completed: 0 };

  orderChart: ChartSegment[] = [];
  stockChart: ChartSegment[] = [];
  unitsChart: ChartSegment[] = [];
  platformChart: ChartSegment[] = [];
  recentOrders: any[] = [];

  ngOnInit() {
    const user = this.auth.getUser();
    if (user?.name) this.userName = user.name.split(' ')[0];
    if (user?.company_name) this.companyName = user.company_name;

    this.dashboard.getStats().subscribe({
      next: (s) => {
        this.raw = s || {};
        this.myApproved = this.countByStatus(s.orders_by_status, 'granted');
        this.myDelivered = this.countByStatus(s.orders_by_status, 'delivered');
        this.orderChart = toChartSegments(s.orders_by_status);
        this.stockChart = toChartSegments(s.stock_by_type, stockLabel);
        this.unitsChart = toChartSegments(s.units_by_type);
        this.platformChart = [
          { label: 'Active clients', value: s.clients ?? 0, color: '#8b5cf6' },
          { label: 'Administrators', value: s.admins ?? 0, color: '#3b82f6' },
          { label: 'Pending clients', value: s.pending_clients ?? 0, color: '#f59e0b' },
        ].filter((x) => x.value > 0);
        this.loading = false;
        this.refreshIcons();
      },
      error: () => {
        this.loading = false;
        this.refreshIcons();
      },
    });

    if (this.can('inspections.complete')) {
      this.inspections.getStats().subscribe({
        next: (s) => { this.inspectorStats = { pool: s.pool ?? 0, assigned: s.assigned ?? 0, completed: s.completed ?? 0 }; this.refreshIcons(); },
        error: () => {},
      });
    }

    if (this.canAny(['orders.view', 'my_orders.view'])) {
      this.orders.getOrders(1, 5).subscribe({
        next: (res) => { this.recentOrders = res.data ?? res ?? []; this.refreshIcons(); },
        error: () => {},
      });
    }
  }

  ngAfterViewInit() {
    this.refreshIcons();
  }

  can(key: string): boolean {
    return this.auth.hasPermission(key);
  }
  canAny(keys: string[]): boolean {
    return this.auth.hasAnyPermission(keys);
  }
  private has(field: string): boolean {
    return Object.prototype.hasOwnProperty.call(this.raw, field);
  }

  get statCards(): StatCard[] {
    const r = this.raw;
    const cards: StatCard[] = [
      { label: 'Active clients', value: r.clients, hint: 'Approved companies', icon: 'building-2', accent: 'from-violet-500/10 to-violet-600/5 text-violet-600', route: '/clients', show: this.can('clients.view') && this.has('clients') },
      { label: 'Pending clients', value: r.pending_clients, hint: 'Awaiting approval', icon: 'user-check', accent: 'from-amber-500/10 to-amber-600/5 text-amber-600', route: '/clients', queryParams: { tab: 'pending' }, show: this.can('clients.view') && this.has('pending_clients') },
      { label: 'Administrators', value: r.admins, hint: 'Platform admins', icon: 'shield', accent: 'from-blue-500/10 to-blue-600/5 text-blue-600', route: '/super-admin-admins', show: this.can('admins.view') && this.has('admins') },
      { label: 'In stock', value: r.extinguishers_in_stock, hint: 'Available units', icon: 'package', accent: 'from-sky-500/10 to-sky-600/5 text-sky-600', route: '/admin-inventory', show: this.can('inventory.view') && this.has('extinguishers_in_stock') },
      { label: 'Total units', value: r.total_extinguishers, hint: 'All extinguishers', icon: 'boxes', accent: 'from-slate-500/10 to-slate-600/5 text-slate-600', route: '/admin-inventory', show: this.can('inventory.view') && this.has('total_extinguishers') },
      { label: 'Pending orders', value: r.pending_orders, hint: 'Awaiting review', icon: 'shopping-bag', accent: 'from-orange-500/10 to-orange-600/5 text-orange-600', route: '/admin-orders', queryParams: { status: 'pending' }, show: this.can('orders.view') && this.has('pending_orders') },
      { label: 'Orders this month', value: r.orders_this_month, hint: 'Placed in ' + this.monthName(), icon: 'calendar', accent: 'from-teal-500/10 to-teal-600/5 text-teal-600', route: '/admin-orders', show: this.can('orders.view') && this.has('orders_this_month') },
      { label: 'Orders approved', value: r.orders_granted, hint: 'Granted to clients', icon: 'package-check', accent: 'from-emerald-500/10 to-emerald-600/5 text-emerald-600', route: '/admin-orders', queryParams: { status: 'granted' }, show: this.can('orders.view') && this.has('orders_granted') },
      { label: 'Inspection pool', value: this.inspectorStats.pool, hint: 'Open to claim', icon: 'search', accent: 'from-teal-500/10 to-teal-600/5 text-teal-600', route: '/inspector-inspections', show: this.can('inspections.complete') },
      { label: 'Assigned to me', value: this.inspectorStats.assigned, hint: 'My inspections', icon: 'list-checks', accent: 'from-violet-500/10 to-violet-600/5 text-violet-600', route: '/inspector-my-inspections', show: this.can('inspections.complete') },
      { label: 'Completed', value: this.inspectorStats.completed, hint: 'Finished', icon: 'check-circle-2', accent: 'from-emerald-500/10 to-emerald-600/5 text-emerald-600', route: '/inspector-my-inspections', show: this.can('inspections.complete') },
      { label: 'My units', value: r.my_units, hint: 'Registered extinguishers', icon: 'flame', accent: 'from-orange-500/10 to-orange-600/5 text-orange-600', route: '/extinguishers', show: this.can('extinguishers.view') && this.has('my_units') },
      { label: 'Approved orders', value: this.myApproved, hint: 'Ready or in transit', icon: 'package-check', accent: 'from-emerald-500/10 to-emerald-600/5 text-emerald-600', route: '/my-orders', show: this.can('my_orders.view') },
      { label: 'Delivered', value: this.myDelivered, hint: 'Completed orders', icon: 'truck', accent: 'from-sky-500/10 to-sky-600/5 text-sky-600', route: '/my-orders', show: this.can('my_orders.view') },
    ];
    return cards.filter((c) => c.show);
  }

  get quickActions(): QuickAction[] {
    const actions: QuickAction[] = [
      { title: 'Add admin', route: '/super-admin-add-admin', icon: 'user-plus', accent: 'from-violet-500/10 to-violet-600/5 text-violet-600', show: this.can('admins.create') },
      { title: 'Review orders', route: '/admin-orders', queryParams: { status: 'pending' }, icon: 'shopping-bag', accent: 'from-orange-500/10 to-orange-600/5 text-orange-600', show: this.can('orders.grant') },
      { title: 'Client approvals', route: '/clients', queryParams: { tab: 'pending' }, icon: 'user-check', accent: 'from-amber-500/10 to-amber-600/5 text-amber-600', show: this.can('clients.approve') },
      { title: 'Inventory', route: '/admin-inventory', icon: 'package', accent: 'from-sky-500/10 to-sky-600/5 text-sky-600', show: this.can('inventory.view') },
      { title: 'Register unit', route: '/admin-add-extinguisher', icon: 'plus-circle', accent: 'from-emerald-500/10 to-emerald-600/5 text-emerald-600', show: this.can('inventory.create') },
      { title: 'Assign inspections', route: '/admin-assigned-inspections', icon: 'clipboard-check', accent: 'from-teal-500/10 to-teal-600/5 text-teal-600', show: this.can('inspections.assign') },
      { title: 'Activity logs', route: '/super-admin-logs', icon: 'scroll-text', accent: 'from-slate-500/10 to-slate-600/5 text-slate-600', show: this.can('activity_logs.view') },
      { title: 'Inspection pool', route: '/inspector-inspections', icon: 'search', accent: 'from-teal-500/10 to-teal-600/5 text-teal-600', show: this.can('inspections.complete') },
      { title: 'Order extinguishers', route: '/place-order', icon: 'shopping-bag', accent: 'from-blue-500/10 to-blue-600/5 text-blue-600', show: this.can('orders.place') },
      { title: 'Track my orders', route: '/my-orders', icon: 'package-check', accent: 'from-violet-500/10 to-violet-600/5 text-violet-600', show: this.can('my_orders.view') },
      { title: 'Service requests', route: '/service-requests', icon: 'wrench', accent: 'from-emerald-500/10 to-emerald-600/5 text-emerald-600', show: this.can('service.request') },
      { title: 'Reports', route: this.auth.reportsRoute(), icon: 'file-text', accent: 'from-blue-500/10 to-blue-600/5 text-blue-600', show: this.can('reports.view') },
    ];
    return actions.filter((a) => a.show);
  }

  get alerts(): DashAlert[] {
    const r = this.raw;
    const list: DashAlert[] = [];
    if (this.can('clients.view') && (r.pending_clients ?? 0) > 0) {
      list.push({ title: 'Clients awaiting approval', subtitle: `${r.pending_clients} registration${r.pending_clients > 1 ? 's' : ''} need review`, icon: 'user-plus', tone: 'bg-amber-50 text-amber-700 ring-amber-200/60', route: '/clients', queryParams: { tab: 'pending' } });
    }
    if (this.can('orders.view') && (r.pending_orders ?? 0) > 0) {
      list.push({ title: 'Pending orders', subtitle: `${r.pending_orders} order${r.pending_orders > 1 ? 's' : ''} awaiting action`, icon: 'shopping-bag', tone: 'bg-orange-50 text-orange-700 ring-orange-200/60', route: '/admin-orders', queryParams: { status: 'pending' } });
    }
    if (this.can('inspections.complete') && this.inspectorStats.pool > 0) {
      list.push({ title: 'Inspections available', subtitle: `${this.inspectorStats.pool} open in the pool`, icon: 'search', tone: 'bg-teal-50 text-teal-700 ring-teal-200/60', route: '/inspector-inspections' });
    }
    return list;
  }

  get ordersLink(): string {
    return this.can('orders.view') ? '/admin-orders' : '/my-orders';
  }

  get showOrderChart(): boolean {
    return this.canAny(['orders.view', 'my_orders.view']);
  }

  countByStatus(rows: { status: string; count: number }[] | undefined, status: string): number {
    if (!rows) return 0;
    const row = rows.find((r) => r.status === status);
    return row ? Number(row.count) : 0;
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = { pending: 'Pending', granted: 'Approved', cancelled: 'Denied', delivered: 'Delivered' };
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

  private monthName(): string {
    return new Date().toLocaleString('en-US', { month: 'long' });
  }

  private refreshIcons() {
    setTimeout(() => lucide?.createIcons?.(), 0);
    setTimeout(() => lucide?.createIcons?.(), 120);
  }
}
