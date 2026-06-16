import { AfterViewInit, Component, OnInit, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { InspectorSidebarComponent } from './inspector-sidebar.component';
import { AuthService } from '../../app/auth.service';

declare const lucide: { createIcons: () => void } | undefined;

@Component({
  selector: 'app-inspector-shell',
  standalone: true,
  imports: [RouterOutlet, InspectorSidebarComponent],
  template: `
    <div class="flex h-screen bg-[#F6F8FC] font-['Poppins'] overflow-hidden">
      <app-inspector-sidebar />
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header class="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
          <p class="text-sm text-slate-500">Inspector portal</p>
          <p class="text-sm font-semibold text-[#0B1437]">{{ userName }}</p>
        </header>
        <main class="flex-1 overflow-y-auto px-6 py-5 md:px-8">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class InspectorShellComponent implements OnInit, AfterViewInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  userName = '';

  ngOnInit() {
    const user = this.auth.getUser();
    this.userName = user?.name ?? 'Inspector';
    if (user?.must_change_password) {
      this.router.navigate(['/inspector-settings']);
    }
  }

  ngAfterViewInit() {
    setTimeout(() => lucide?.createIcons?.(), 50);
  }
}
