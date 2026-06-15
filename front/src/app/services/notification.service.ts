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
  private readonly storageKey = 'fems_notifications';

  private notificationsSignal = signal<AppNotification[]>(this.loadInitial());

  readonly notifications = this.notificationsSignal.asReadonly();
  readonly unreadCount = computed(() => this.notificationsSignal().filter(n => !n.read).length);

  private loadInitial(): AppNotification[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) return JSON.parse(stored);
    } catch { /* use defaults */ }
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
        link: '/extinguishers?filter=attention'
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
        link: '/my-orders?status=pending'
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
        link: '/reports'
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
        link: '/dashboard'
      }
    ];
  }

  private persist(list: AppNotification[]) {
    localStorage.setItem(this.storageKey, JSON.stringify(list));
    this.notificationsSignal.set(list);
  }

  markAsRead(id: number) {
    const next = this.notificationsSignal().map(n => n.id === id ? { ...n, read: true } : n);
    this.persist(next);
  }

  markAllAsRead() {
    const next = this.notificationsSignal().map(n => ({ ...n, read: true }));
    this.persist(next);
  }
}
