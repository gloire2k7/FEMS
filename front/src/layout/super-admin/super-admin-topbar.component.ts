import { AfterViewInit, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DashboardService } from '../../app/services/dashboard.service';

declare const lucide: { createIcons: () => void } | undefined;

@Component({
  selector: 'app-super-admin-topbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './super-admin-topbar.component.html',
})
export class SuperAdminTopbarComponent implements AfterViewInit {
  private dashboard = inject(DashboardService);
  pendingClients = 0;

  ngAfterViewInit() {
    this.dashboard.getStats().subscribe({
      next: (s) => { this.pendingClients = s.pending_clients ?? 0; },
      error: () => {},
    });
    setTimeout(() => lucide?.createIcons?.(), 50);
  }
}
