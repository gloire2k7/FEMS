import { AfterViewInit, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NotificationService } from '../../app/services/notification.service';

declare const lucide: { createIcons: () => void } | undefined;

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
})
export class Topbar implements OnInit, AfterViewInit {
  protected notifications = inject(NotificationService);

  get unreadCount() {
    return this.notifications.unreadCount();
  }

  ngOnInit() {
    this.notifications.refreshUnreadCount().subscribe();
  }

  ngAfterViewInit() {
    this.refreshIcons();
  }

  refreshIcons() {
    setTimeout(() => {
      if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
    }, 50);
  }
}
