import { AfterViewInit, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AdminSidebarComponent } from './admin-sidebar.component';
import { AdminTopbarComponent } from './admin-topbar.component';

declare const lucide: { createIcons: () => void } | undefined;

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [RouterOutlet, AdminSidebarComponent, AdminTopbarComponent],
  template: `
    <div class="flex h-screen bg-[#F6F8FC] font-['Poppins'] overflow-hidden">
      <app-admin-sidebar />
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <app-admin-topbar />
        <main class="flex-1 overflow-y-auto px-6 py-5 md:px-8">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class AdminShellComponent implements AfterViewInit {
  ngAfterViewInit() {
    setTimeout(() => lucide?.createIcons?.(), 50);
  }
}
