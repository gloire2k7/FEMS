import { AfterViewInit, Component, OnInit, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../app/auth.service';
import { SidebarStateService } from '../../app/services/sidebar-state.service';

declare const lucide: { createIcons: () => void } | undefined;

@Component({
  selector: 'app-inspector-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './inspector-sidebar.component.html',
})
export class InspectorSidebarComponent implements OnInit, AfterViewInit {
  protected sidebar = inject(SidebarStateService);
  private auth = inject(AuthService);
  private router = inject(Router);

  userName = 'Inspector';

  ngOnInit() {
    const user = this.auth.getUser();
    if (user?.name) this.userName = user.name;
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

  ngAfterViewInit() {
    setTimeout(() => lucide?.createIcons?.(), 50);
  }

  toggleSidebar() {
    this.sidebar.toggle();
    setTimeout(() => lucide?.createIcons?.(), 50);
  }
}
