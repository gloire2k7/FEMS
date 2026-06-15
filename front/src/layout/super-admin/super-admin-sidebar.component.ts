import { Component, OnInit, inject, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../app/auth.service';
import { DashboardService } from '../../app/services/dashboard.service';

declare const lucide: { createIcons: () => void } | undefined;

@Component({
  selector: 'app-super-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './super-admin-sidebar.component.html',
})
export class SuperAdminSidebarComponent implements OnInit, AfterViewInit {
  private auth = inject(AuthService);
  private dashboard = inject(DashboardService);
  private router = inject(Router);

  userName = 'Super Admin';
  pendingClients = 0;
  adminCount = 0;

  ngOnInit() {
    const user = this.auth.getUser();
    if (user?.name) this.userName = user.name;

    this.dashboard.getStats().subscribe({
      next: (s) => {
        this.pendingClients = s.pending_clients ?? 0;
        this.adminCount = s.admins ?? 0;
      },
      error: () => {},
    });
  }

  ngAfterViewInit() {
    setTimeout(() => lucide?.createIcons?.(), 50);
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
      },
    });
  }
}
