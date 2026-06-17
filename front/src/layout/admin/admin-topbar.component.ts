import { AfterViewInit, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DashboardService } from '../../app/services/dashboard.service';
import { NotificationService } from '../../app/services/notification.service';

declare const lucide: { createIcons: () => void } | undefined;

@Component({
  selector: 'app-admin-topbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-topbar.component.html',
})
export class AdminTopbarComponent implements OnInit, AfterViewInit {
  private dashboard = inject(DashboardService);
  protected notifications = inject(NotificationService);
  pendingOrders = 0;

  get unreadCount() {
    return this.notifications.adminUnreadCount();
  }

  ngOnInit() {
    this.notifications.refreshUnreadCount().subscribe();
  }

  ngAfterViewInit() {
    this.dashboard.getStats().subscribe({
      next: (s) => { this.pendingOrders = s.pending_orders ?? 0; },
      error: () => {}
    });
    setTimeout(() => lucide?.createIcons?.(), 50);
  }
}
