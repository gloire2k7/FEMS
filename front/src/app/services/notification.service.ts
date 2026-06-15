import { Injectable, signal, computed } from '@angular/core';

export interface AppNotification {
  id: number;
  type: 'warning' | 'critical' | 'info' | 'system';
  title: string;
  message: string;
  time: string;
  read: boolean;
  icon: string;
  iconClass: string;
  link?: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly clientStorageKey = 'fems_notifications';
  private readonly adminStorageKey = 'fems_admin_notifications';

  private clientSignal = signal<AppNotification[]>(this.loadClientInitial());
  private adminSignal = signal<AppNotification[]>(this.loadAdminInitial());

  readonly notifications = this.clientSignal.asReadonly();
  readonly adminNotifications = this.adminSignal.asReadonly();

  readonly unreadCount = computed(() => this.clientSignal().filter(n => !n.read).length);
  readonly adminUnreadCount = computed(() => this.adminSignal().filter(n => !n.read).length);

  private loadClientInitial(): AppNotification[] {
    try {
      const stored = localStorage.getItem(this.clientStorageKey);
      if (stored) return JSON.parse(stored);
    } catch { /* defaults */ }
    return [
      {
        id: 1,
        type: 'warning',
        title: 'Maintenance due',
        message: 'One of your extinguishers is due for a refill soon.',
        time: '2 hours ago',
        read: false,
        icon: 'alert-triangle',
        iconClass: 'bg-amber-50 text-amber-600',
        link: '/extinguishers?filter=attention',
      },
      {
        id: 2,
        type: 'info',
        title: 'Order update',
        message: 'Your recent order is pending admin review.',
        time: 'Yesterday',
        read: false,
        icon: 'package',
        iconClass: 'bg-blue-50 text-blue-600',
        link: '/my-orders?status=pending',
      },
      {
        id: 3,
        type: 'info',
        title: 'Inspection completed',
        message: 'A quarterly inspection was completed at your site.',
        time: '3 days ago',
        read: true,
        icon: 'clipboard-check',
        iconClass: 'bg-emerald-50 text-emerald-600',
        link: '/reports',
      },
      {
        id: 4,
        type: 'system',
        title: 'Welcome to FEMS',
        message: 'Browse the shop to order extinguishers or track units from your dashboard.',
        time: '1 week ago',
        read: true,
        icon: 'bell',
        iconClass: 'bg-slate-100 text-slate-600',
        link: '/dashboard',
      },
    ];
  }

  private loadAdminInitial(): AppNotification[] {
    try {
      const stored = localStorage.getItem(this.adminStorageKey);
      if (stored) return JSON.parse(stored);
    } catch { /* defaults */ }
    return [
      {
        id: 101,
        type: 'critical',
        title: 'New client registration',
        message: 'TechCorp Industries signed up and is awaiting your approval.',
        time: '30 min ago',
        read: false,
        icon: 'user-plus',
        iconClass: 'bg-red-50 text-red-600',
        link: '/clients?tab=pending',
      },
      {
        id: 102,
        type: 'warning',
        title: 'Order pending review',
        message: 'Order #14 from Global Logistics needs approval — 6 units requested.',
        time: '1 hour ago',
        read: false,
        icon: 'shopping-bag',
        iconClass: 'bg-amber-50 text-amber-600',
        link: '/admin-orders?status=pending',
      },
      {
        id: 103,
        type: 'warning',
        title: 'Low stock alert',
        message: 'CO₂ 5kg units are below minimum threshold (3 remaining).',
        time: '3 hours ago',
        read: false,
        icon: 'package',
        iconClass: 'bg-orange-50 text-orange-600',
        link: '/admin-inventory',
      },
      {
        id: 104,
        type: 'info',
        title: 'Inspection submitted',
        message: 'Inspector Mike Ross submitted results for EXT-2023-42.',
        time: 'Yesterday',
        read: true,
        icon: 'clipboard-check',
        iconClass: 'bg-emerald-50 text-emerald-600',
        link: '/admin-assigned-inspections',
      },
      {
        id: 105,
        type: 'system',
        title: 'Welcome, Admin',
        message: 'Use the dashboard to review orders, clients, and inventory at a glance.',
        time: '1 week ago',
        read: true,
        icon: 'layout-dashboard',
        iconClass: 'bg-slate-100 text-slate-600',
        link: '/admin-dashboard',
      },
    ];
  }

  private persistClient(list: AppNotification[]) {
    localStorage.setItem(this.clientStorageKey, JSON.stringify(list));
    this.clientSignal.set(list);
  }

  private persistAdmin(list: AppNotification[]) {
    localStorage.setItem(this.adminStorageKey, JSON.stringify(list));
    this.adminSignal.set(list);
  }

  markAsRead(id: number) {
    const next = this.clientSignal().map(n => (n.id === id ? { ...n, read: true } : n));
    this.persistClient(next);
  }

  markAllAsRead() {
    this.persistClient(this.clientSignal().map(n => ({ ...n, read: true })));
  }

  markAdminAsRead(id: number) {
    const next = this.adminSignal().map(n => (n.id === id ? { ...n, read: true } : n));
    this.persistAdmin(next);
  }

  markAllAdminAsRead() {
    this.persistAdmin(this.adminSignal().map(n => ({ ...n, read: true })));
  }
}
