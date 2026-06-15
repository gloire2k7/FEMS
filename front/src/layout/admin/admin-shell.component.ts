import { AfterViewInit, Component, OnInit, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AdminSidebarComponent } from './admin-sidebar.component';
import { AdminTopbarComponent } from './admin-topbar.component';
import { AuthService } from '../../app/auth.service';

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
export class AdminShellComponent implements OnInit, AfterViewInit {
  private auth = inject(AuthService);
  private router = inject(Router);

  ngOnInit() {
    const user = this.auth.getUser();
    if (user?.must_change_password) {
      this.router.navigate(['/admin-settings']);
    }
  }

  ngAfterViewInit() {
    setTimeout(() => lucide?.createIcons?.(), 50);
  }
}
