import { AfterViewInit, Component, OnInit, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { InspectorSidebarComponent } from './inspector-sidebar.component';
import { InspectorTopbarComponent } from './inspector-topbar.component';
import { AuthService } from '../../app/auth.service';
import { SidebarStateService } from '../../app/services/sidebar-state.service';

declare const lucide: { createIcons: () => void } | undefined;

@Component({
  selector: 'app-inspector-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, InspectorSidebarComponent, InspectorTopbarComponent],
  template: `
    <div class="flex h-screen bg-[#F6F8FC] font-['Poppins'] overflow-hidden">
      @if (sidebar.mobileOpen()) {
        <div class="fixed inset-0 bg-black/50 z-30 lg:hidden" (click)="sidebar.closeMobile()"></div>
      }
      <app-inspector-sidebar />
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <app-inspector-topbar />
        <main class="flex-1 overflow-y-auto px-4 py-5 md:px-8">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class InspectorShellComponent implements OnInit, AfterViewInit {
  protected sidebar = inject(SidebarStateService);
  private auth = inject(AuthService);
  private router = inject(Router);

  ngOnInit() {
    const user = this.auth.getUser();
    if (user?.must_change_password) {
      this.router.navigate(['/inspector-settings']);
    }
  }

  ngAfterViewInit() {
    setTimeout(() => lucide?.createIcons?.(), 50);
  }
}
