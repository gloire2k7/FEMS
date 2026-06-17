import { AfterViewInit, Component, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AdminSidebarComponent } from './admin-sidebar.component';
import { AdminTopbarComponent } from './admin-topbar.component';
import { AuthService } from '../../app/auth.service';
import { SidebarStateService } from '../../app/services/sidebar-state.service';

declare const lucide: { createIcons: () => void } | undefined;

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [RouterOutlet, AdminSidebarComponent, AdminTopbarComponent],
  template: `
    <div class="flex h-screen bg-[#F6F8FC] font-['Poppins'] overflow-hidden">
      @if (sidebar.mobileOpen()) {
        <div class="fixed inset-0 bg-black/50 z-30 lg:hidden" (click)="sidebar.closeMobile()"></div>
      }
      <app-admin-sidebar />
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <app-admin-topbar />
        <main class="flex-1 overflow-y-auto px-4 py-5 md:px-8">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class AdminShellComponent implements OnInit, AfterViewInit {
  protected sidebar = inject(SidebarStateService);
  private auth = inject(AuthService);
  private router = inject(Router);

  ngOnInit() {
    const user = this.auth.getUser();
    if (user?.must_change_password) {
      this.router.navigate(['/admin-settings']);
      return;
    }
    this.syncAdminSession();

    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => this.syncAdminSession());
  }

  ngAfterViewInit() {
    setTimeout(() => lucide?.createIcons?.(), 50);
  }

  private syncAdminSession() {
    if (!this.auth.isRole('Admin')) return;
    this.auth.refreshMe().subscribe({ error: () => {} });
  }
}
