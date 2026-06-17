import { AfterViewInit, Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../app/auth.service';

declare const lucide: { createIcons: () => void } | undefined;

@Component({
  selector: 'app-inspector-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="w-64 bg-gradient-to-b from-[#0B1437] to-[#020617] p-6 flex flex-col h-screen shrink-0 overflow-y-auto">
      <div class="flex items-center gap-3 mb-10 pl-1">
        <div class="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
          <i data-lucide="clipboard-check" class="w-5 h-5 text-white"></i>
        </div>
        <div>
          <span class="text-xl font-bold text-white tracking-wide">FEMS</span>
          <p class="text-xs text-slate-400 font-medium">Inspector portal</p>
        </div>
      </div>

      <nav class="space-y-1 text-base flex-1">
        <a routerLink="/inspector-dashboard" routerLinkActive="bg-white/10 text-white" [routerLinkActiveOptions]="{ exact: true }"
          class="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
          <i data-lucide="layout-dashboard" class="w-5 h-5 shrink-0"></i>
          <span class="font-medium">Dashboard</span>
        </a>
        <a routerLink="/inspector-inspections" routerLinkActive="bg-white/10 text-white"
          class="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
          <i data-lucide="search" class="w-5 h-5 shrink-0"></i>
          <span class="font-medium">Inspections</span>
        </a>
        <a routerLink="/inspector-my-inspections" routerLinkActive="bg-white/10 text-white"
          class="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
          <i data-lucide="list-checks" class="w-5 h-5 shrink-0"></i>
          <span class="font-medium">My inspections</span>
        </a>
        <a routerLink="/inspector-mandatory-inspections" routerLinkActive="bg-white/10 text-white"
          class="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
          <i data-lucide="calendar-check" class="w-5 h-5 shrink-0"></i>
          <span class="font-medium">Mandatory</span>
        </a>
        <a routerLink="/inspector-reports" routerLinkActive="bg-white/10 text-white"
          class="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
          <i data-lucide="file-text" class="w-5 h-5 shrink-0"></i>
          <span class="font-medium">Reports</span>
        </a>
        <a routerLink="/inspector-notifications" routerLinkActive="bg-white/10 text-white"
          class="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
          <i data-lucide="bell" class="w-5 h-5 shrink-0"></i>
          <span class="font-medium">Notifications</span>
        </a>
        <a routerLink="/inspector-settings" routerLinkActive="bg-white/10 text-white"
          class="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
          <i data-lucide="settings" class="w-5 h-5 shrink-0"></i>
          <span class="font-medium">Settings</span>
        </a>
      </nav>

      <div class="mt-auto pt-6">
        <button type="button" (click)="onLogout()"
          class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/5 hover:text-red-400 transition-colors">
          <i data-lucide="log-out" class="w-5 h-5 shrink-0"></i>
          <span class="font-medium">Sign out</span>
        </button>
      </div>
    </aside>
  `
})
export class InspectorSidebarComponent implements AfterViewInit {
  private auth = inject(AuthService);
  private router = inject(Router);

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
}
