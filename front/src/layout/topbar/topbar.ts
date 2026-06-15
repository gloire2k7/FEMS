import { AfterViewInit, Component, inject } from '@angular/core';
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
export class Topbar implements AfterViewInit {
  protected notifications = inject(NotificationService);

  get unreadCount() {
    return this.notifications.unreadCount();
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
