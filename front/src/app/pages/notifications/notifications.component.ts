import { AfterViewInit, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NotificationService, AppNotification } from '../../services/notification.service';

declare const lucide: { createIcons: () => void } | undefined;

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="client-page">
      <section class="client-hero">
        <div class="client-hero-inner flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p class="client-hero-eyebrow">Updates</p>
            <h1 class="client-hero-title">Notifications</h1>
            <p class="client-hero-sub">
              {{ unreadCount > 0 ? unreadCount + ' unread notification' + (unreadCount === 1 ? '' : 's') : 'You are all caught up.' }}
            </p>
          </div>
          <button *ngIf="unreadCount > 0" type="button" (click)="markAllAsRead()" class="client-hero-btn shrink-0">
            <i data-lucide="check-check" class="w-5 h-5"></i>
            Mark all read
          </button>
        </div>
      </section>

      <section *ngIf="list.length === 0" class="client-card client-empty">
        <div class="client-empty-icon">
          <i data-lucide="bell-off" class="w-8 h-8"></i>
        </div>
        <p class="text-lg font-semibold text-[#0B1437]">No notifications</p>
        <p class="text-base text-slate-500 mt-2">Alerts about orders, maintenance, and inspections will appear here.</p>
      </section>

      <section *ngIf="list.length > 0" class="space-y-3">
        <article *ngFor="let n of list" (click)="openNotification(n)"
          class="client-card client-card--lift p-5 flex items-start gap-4 cursor-pointer transition-colors"
          [class.ring-2]="!n.read"
          [class.ring-[#0B1437]/10]="!n.read"
          [class.border-[#0B1437]/15]="!n.read">
          <span class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" [ngClass]="n.iconClass">
            <i [attr.data-lucide]="n.icon" class="w-6 h-6"></i>
          </span>
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-3">
              <h3 class="text-base font-semibold text-[#0B1437]" [class.text-slate-600]="n.read">{{ n.title }}</h3>
              <span *ngIf="!n.read" class="w-2.5 h-2.5 rounded-full bg-[#0B1437] shrink-0 mt-2"></span>
            </div>
            <p class="text-base text-slate-500 mt-1 leading-relaxed">{{ n.message }}</p>
            <p class="text-sm text-slate-400 mt-2">{{ n.time }}</p>
          </div>
          <i data-lucide="chevron-right" class="w-5 h-5 text-slate-300 shrink-0 mt-1"></i>
        </article>
      </section>
    </div>
  `
})
export class NotificationsComponent implements AfterViewInit {
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  get list() {
    return this.notificationService.notifications();
  }

  get unreadCount() {
    return this.notificationService.unreadCount();
  }

  ngAfterViewInit() {
    setTimeout(() => lucide?.createIcons?.(), 50);
  }

  markAllAsRead() {
    this.notificationService.markAllAsRead();
    setTimeout(() => lucide?.createIcons?.(), 50);
  }

  openNotification(n: AppNotification) {
    this.notificationService.markAsRead(n.id);
    if (n.link) {
      this.router.navigateByUrl(n.link);
    }
    setTimeout(() => lucide?.createIcons?.(), 50);
  }
}
