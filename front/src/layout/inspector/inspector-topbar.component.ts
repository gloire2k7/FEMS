import { AfterViewInit, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NotificationService } from '../../app/services/notification.service';
import { SidebarStateService } from '../../app/services/sidebar-state.service';
import { AuthService } from '../../app/auth.service';

declare const lucide: { createIcons: () => void } | undefined;

@Component({
  selector: 'app-inspector-topbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './inspector-topbar.component.html',
})
export class InspectorTopbarComponent implements OnInit, AfterViewInit {
  protected notifications = inject(NotificationService);
  protected sidebar = inject(SidebarStateService);
  private auth = inject(AuthService);

  userName = 'Inspector';

  get unreadCount() {
    return this.notifications.unreadCount();
  }

  ngOnInit() {
    const user = this.auth.getUser();
    if (user?.name) this.userName = user.name;
    this.notifications.refreshUnreadCount().subscribe();
  }

  ngAfterViewInit() {
    setTimeout(() => lucide?.createIcons?.(), 50);
  }
}
