import { AfterViewInit, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { UnifiedSidebarComponent } from './unified-sidebar.component';
import { Topbar } from '../topbar/topbar';
import { AuthService } from '../../app/auth.service';
import { SidebarStateService } from '../../app/services/sidebar-state.service';

declare const lucide: { createIcons: () => void } | undefined;

@Component({
  selector: 'app-unified-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, UnifiedSidebarComponent, Topbar],
  template: `
    <div class="flex h-screen bg-[#F6F8FC] font-['Poppins'] overflow-hidden">
      @if (sidebar.mobileOpen()) {
        <div class="fixed inset-0 bg-black/50 z-30 lg:hidden" (click)="sidebar.closeMobile()"></div>
      }
      <app-unified-sidebar />
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <app-topbar />
        <main class="flex-1 overflow-y-auto px-4 py-5 md:px-8">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class UnifiedShellComponent implements OnInit, AfterViewInit {
  protected sidebar = inject(SidebarStateService);
  private auth = inject(AuthService);
  private router = inject(Router);

  ngOnInit() {
    const user = this.auth.getUser();
    if (user?.must_change_password) {
      this.router.navigate(['/settings']);
      return;
    }
    this.syncSession();
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => this.syncSession());
  }

  ngAfterViewInit() {
    setTimeout(() => lucide?.createIcons?.(), 50);
  }

  private syncSession() {
    // Keep permissions/role fresh so sidebar reflects any access changes.
    this.auth.refreshMe().subscribe({ error: () => {} });
  }
}
