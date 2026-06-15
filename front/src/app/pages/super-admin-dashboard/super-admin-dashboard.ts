import { Component, AfterViewInit, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth.service';
import { DashboardService } from '../../services/dashboard.service';

declare const lucide: { createIcons: () => void } | undefined;

@Component({
  selector: 'app-super-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './super-admin-dashboard.html',
  styleUrls: ['./super-admin-dashboard.css']
})
export class SuperAdminDashboard implements AfterViewInit, OnInit {
  private authService = inject(AuthService);
  private dashboard = inject(DashboardService);
  private router = inject(Router);

  userName = 'Super Admin';
  stats: any = {};
  statsCards: any[] = [];
  criticalIssues: any[] = [];
  chartData: any[] = [];
  distribution: any[] = [];

  ngOnInit() {
    const user = this.authService.getUser();
    if (user?.name) this.userName = user.name;

    this.dashboard.getStats().subscribe({
      next: (s) => {
        this.stats = s;
        this.statsCards = [
          { label: 'Active Clients', value: s.clients, route: '/super-admin-clients', sub: `${s.pending_clients} pending approval` },
          { label: 'Admins', value: s.admins, route: '/super-admin-admins', sub: 'Manage personnel' },
          { label: 'Units In Stock', value: s.extinguishers_in_stock, route: '/admin-inventory', sub: `${s.total_extinguishers} total registered` },
          { label: 'Pending Orders', value: s.pending_orders, route: '/admin-orders', sub: `${s.orders_this_month} this month` },
        ];
        if (s.pending_clients > 0) {
          this.criticalIssues = [{ title: 'Clients awaiting approval', subtitle: `${s.pending_clients} registrations need review`, type: 'warning', actionName: 'Review', route: '/super-admin-clients' }];
        }
        this.chartData = (s.orders_by_status || []).map((o: any) => ({ month: o.status, value: o.count }));
        this.distribution = (s.stock_by_type || []).map((t: any) => ({ label: t.type, percentage: t.count, color: 'bg-blue-500' }));
      }
    });
  }

  goCard(route: string) { this.router.navigate([route]); }

  onLogout() {
    this.authService.logout().subscribe({
      next: () => { this.authService.clearUser(); this.router.navigate(['/signin']); },
      error: () => { this.authService.clearUser(); this.router.navigate(['/signin']); }
    });
  }

  ngAfterViewInit() { lucide?.createIcons?.(); }
}
