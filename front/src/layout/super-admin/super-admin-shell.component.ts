import { AfterViewInit, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SuperAdminSidebarComponent } from './super-admin-sidebar.component';
import { SuperAdminTopbarComponent } from './super-admin-topbar.component';

declare const lucide: { createIcons: () => void } | undefined;

@Component({
  selector: 'app-super-admin-shell',
  standalone: true,
  imports: [RouterOutlet, SuperAdminSidebarComponent, SuperAdminTopbarComponent],
  template: `
    <div class="flex h-screen bg-[#F6F8FC] font-['Poppins'] overflow-hidden">
      <app-super-admin-sidebar />
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <app-super-admin-topbar />
        <main class="flex-1 overflow-y-auto px-6 py-5 md:px-8">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class SuperAdminShellComponent implements AfterViewInit {
  ngAfterViewInit() {
    setTimeout(() => lucide?.createIcons?.(), 50);
  }
}
