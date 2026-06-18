import { Component, OnInit, inject, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../app/auth.service';
import { DashboardService } from '../../app/services/dashboard.service';
import { NotificationService } from '../../app/services/notification.service';
import { SidebarStateService } from '../../app/services/sidebar-state.service';

declare const lucide: { createIcons: () => void } | undefined;

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './admin-sidebar.component.html',
})
export class AdminSidebarComponent implements OnInit, AfterViewInit {
  private auth = inject(AuthService);
  private dashboard = inject(DashboardService);
  private notifications = inject(NotificationService);
  private router = inject(Router);
  protected sidebar = inject(SidebarStateService);

  userName = 'Admin';
  pendingOrders = 0;
  pendingClients = 0;
  inspectionsOpen = false;

  get unreadNotifications() {
    return this.notifications.adminUnreadCount();
  }

  ngOnInit() {
    const user = this.auth.getUser();
    if (user?.name) this.userName = user.name;

    this.auth.user$.subscribe((u) => {
      if (u?.name) this.userName = u.name;
      setTimeout(() => lucide?.createIcons?.(), 50);
    });

    this.dashboard.getStats().subscribe({
      next: (s) => {
        this.pendingOrders = s.pending_orders ?? 0;
        this.pendingClients = s.pending_clients ?? 0;
      },
      error: () => {}
    });
  }

  ngAfterViewInit() {
    setTimeout(() => lucide?.createIcons?.(), 50);
  }

  hasPermission(key: string): boolean {
    return this.auth.hasPermission(key);
  }

  hasAnyPermission(keys: string[]): boolean {
    return keys.some(k => this.auth.hasPermission(k));
  }

  toggleSidebar() {
    this.sidebar.toggle();
    if (this.sidebar.collapsed()) {
      this.inspectionsOpen = false;
    }
    setTimeout(() => lucide?.createIcons?.(), 50);
  }

  toggleInspections() {
    this.inspectionsOpen = !this.inspectionsOpen;
    setTimeout(() => lucide?.createIcons?.(), 50);
  }

  onLogout() {
    this.auth.logout().subscribe({
      next: () => {
        this.auth.clearUser();
        this.router.navigate(['/signin']);
      },
      error: () => {
        this.auth.clearUser();
        this.router.navigate(['/signin']);
      }
    });
  }
}
