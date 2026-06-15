import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SidebarComponent } from '../layout/sidebar/sidebar';
import { Topbar } from '../layout/topbar/topbar';
import { AiAssistantComponent } from './shared/ai-assistant/ai-assistant.component';
import { AuthService } from './auth.service';

declare const lucide: { createIcons: (opts?: { nameAttr?: string }) => void } | undefined;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, Topbar, AiAssistantComponent],
  templateUrl: './app.component.html'
})
export class AppComponent {
  constructor(private router: Router, private auth: AuthService) {
    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe(() => {
      this.runCreateIcons();
    });
  }

  showAiAssistant(): boolean {
    const path = this.router.url.split('?')[0];
    return path !== '/' && path !== '/signin' && !!this.auth.getUser();
  }

  showLayout(): boolean {
    const path = this.router.url.split('?')[0];
    if (path.startsWith('/admin-') || path.startsWith('/super-admin-') || path === '/clients') return false;
    const excludedRoutes = ['/', '/signin', '/signup', '/admin-dashboard', '/super-admin-dashboard', '/super-admin-clients', '/super-admin-client-details', '/super-admin-add-admin', '/super-admin-admins', '/super-admin-admin-details', '/super-admin-reports', '/super-admin-logs', '/clients', '/admin-locations', '/admin-location-details', '/admin-view-extinguisher', '/admin-add-extinguisher', '/admin-inspection-label', '/admin-assigned-inspections', '/admin-inventory', '/admin-inspectors', '/admin-compliance', '/admin-refills', '/admin-settings', '/admin-orders'];
    if (excludedRoutes.includes(path)) return false;
    if (path.startsWith('/admin-view-extinguisher/') || path.startsWith('/admin-inspection-label/') || path.startsWith('/super-admin-admin-details/')) return false;
    return true;
  }

  private runCreateIcons(): void {
    const run = () => lucide?.createIcons?.();
    setTimeout(run, 0);
    setTimeout(run, 150);
  }
}
