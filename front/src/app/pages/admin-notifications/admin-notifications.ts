import { AfterViewInit, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NotificationService, AppNotification } from '../../services/notification.service';

declare const lucide: { createIcons: () => void } | undefined;

@Component({
  selector: 'app-admin-notifications',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-notifications.html',
})
export class AdminNotificationsComponent implements OnInit, AfterViewInit {
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  filter: 'all' | 'unread' = 'all';
  loading = true;

  ngOnInit() {
    this.notificationService.refresh().subscribe({
      next: () => { this.loading = false; this.refreshIcons(); },
      error: () => { this.loading = false; }
    });
  }

  get list(): AppNotification[] {
    const all = this.notificationService.adminNotifications();
    if (this.filter === 'unread') return all.filter(n => !n.read && !n.is_read);
    return all;
  }

  get unreadCount() {
    return this.notificationService.adminUnreadCount();
  }

  setFilter(f: 'all' | 'unread') {
    this.filter = f;
    this.refreshIcons();
  }

  markAllAsRead() {
    this.notificationService.markAllAdminAsRead();
    this.refreshIcons();
  }

  openNotification(n: AppNotification) {
    this.notificationService.markAdminAsRead(n.id);
    if (n.link) this.router.navigateByUrl(n.link);
    this.refreshIcons();
  }

  ngAfterViewInit() {
    this.refreshIcons();
  }

  private refreshIcons() {
    setTimeout(() => lucide?.createIcons?.(), 0);
    setTimeout(() => lucide?.createIcons?.(), 120);
  }
}
