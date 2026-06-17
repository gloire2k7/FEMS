import { AfterViewInit, Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SuperAdminSidebarComponent } from './super-admin-sidebar.component';
import { SuperAdminTopbarComponent } from './super-admin-topbar.component';
import { SidebarStateService } from '../../app/services/sidebar-state.service';

declare const lucide: { createIcons: () => void } | undefined;

@Component({
  selector: 'app-super-admin-shell',
  standalone: true,
  imports: [RouterOutlet, SuperAdminSidebarComponent, SuperAdminTopbarComponent],
  template: `
    <div class="flex h-screen bg-[#F6F8FC] font-['Poppins'] overflow-hidden">
      @if (sidebar.mobileOpen()) {
        <div class="fixed inset-0 bg-black/50 z-30 lg:hidden" (click)="sidebar.closeMobile()"></div>
      }
      <app-super-admin-sidebar />
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <app-super-admin-topbar />
        <main class="flex-1 overflow-y-auto px-4 py-5 md:px-8">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class SuperAdminShellComponent implements AfterViewInit {
  protected sidebar = inject(SidebarStateService);
  ngAfterViewInit() {
    setTimeout(() => lucide?.createIcons?.(), 50);
  }
}
