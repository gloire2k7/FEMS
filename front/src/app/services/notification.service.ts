import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface AppNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
  time?: string;
  read?: boolean;
  icon?: string;
  iconClass?: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8000/api/notifications';

  private listSignal = signal<AppNotification[]>([]);
  private unreadSignal = signal(0);
  private loaded = false;

  readonly notifications = this.listSignal.asReadonly();
  readonly adminNotifications = this.listSignal.asReadonly();
  readonly unreadCount = computed(() => this.unreadSignal());
  readonly adminUnreadCount = computed(() => this.unreadSignal());

  refresh(page = 1): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}?page=${page}`, { withCredentials: true }).pipe(
      tap(res => {
        const mapped = (res.data ?? []).map((n: any) => this.mapNotification(n));
        this.listSignal.set(mapped);
        this.unreadSignal.set(res.unread ?? mapped.filter((n: AppNotification) => !n.is_read).length);
        this.loaded = true;
      })
    );
  }

  refreshUnreadCount(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/unread-count`, { withCredentials: true }).pipe(
      tap(res => this.unreadSignal.set(res.unread ?? 0))
    );
  }

  ensureLoaded() {
    if (!this.loaded) {
      this.refresh().subscribe();
    }
  }

  markAsRead(id: number) {
    this.http.put(`${this.apiUrl}/${id}/read`, {}, { withCredentials: true }).subscribe({
      next: (res: any) => {
        this.listSignal.update(list => list.map(n => n.id === id ? { ...n, is_read: true, read: true } : n));
        this.unreadSignal.set(res.unread ?? 0);
      }
    });
  }

  markAdminAsRead(id: number) { this.markAsRead(id); }

  markAllAsRead() {
    this.http.put(`${this.apiUrl}/read-all`, {}, { withCredentials: true }).subscribe({
      next: () => {
        this.listSignal.update(list => list.map(n => ({ ...n, is_read: true, read: true })));
        this.unreadSignal.set(0);
      }
    });
  }

  markAllAdminAsRead() { this.markAllAsRead(); }

  private mapNotification(n: any): AppNotification {
    const typeMap: Record<string, { icon: string; iconClass: string }> = {
      critical: { icon: 'alert-octagon', iconClass: 'bg-red-50 text-red-600' },
      warning:  { icon: 'alert-triangle', iconClass: 'bg-amber-50 text-amber-600' },
      info:     { icon: 'bell', iconClass: 'bg-blue-50 text-blue-600' },
      system:   { icon: 'layout-dashboard', iconClass: 'bg-slate-100 text-slate-600' },
    };
    const meta = typeMap[n.type] ?? typeMap['info'];
    return {
      ...n,
      read: !!n.is_read,
      time: this.formatTime(n.created_at),
      icon: meta.icon,
      iconClass: meta.iconClass,
    };
  }

  private formatTime(dateStr: string): string {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  }
}
