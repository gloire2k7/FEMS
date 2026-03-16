import { Component } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SidebarComponent } from '../layout/sidebar/sidebar';
import { Topbar } from '../layout/topbar/topbar';

declare const lucide: { createIcons: (opts?: { nameAttr?: string }) => void } | undefined;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, Topbar],
  templateUrl: './app.component.html'
})
export class AppComponent {
  constructor(private router: Router) {
    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe(() => {
      this.runCreateIcons();
    });
  }

  /** Show sidebar and topbar only for dashboard (and other app routes), not for sign-in/sign-up. */
  showLayout(): boolean {
    const path = this.router.url.split('?')[0];
    // Never show the client layout for Admin/Super Admin areas (covers trailing slashes, nested segments, etc.).
    if (path.startsWith('/admin-') || path.startsWith('/super-admin-') || path === '/clients') return false;
    const excludedRoutes = ['/', '/signin', '/signup', '/admin-dashboard', '/super-admin-dashboard', '/super-admin-clients', '/super-admin-client-details', '/super-admin-add-admin', '/super-admin-admins', '/super-admin-admin-details', '/super-admin-reports', '/super-admin-logs', '/clients', '/admin-locations', '/admin-location-details', '/admin-view-extinguisher', '/admin-add-extinguisher', '/admin-inspection-label', '/admin-assigned-inspections', '/admin-inventory', '/admin-inspectors', '/admin-compliance', '/admin-refills', '/admin-settings', '/admin-orders'];

    // Check for exact matches or paths starting with certain prefixes
    if (excludedRoutes.includes(path)) return false;
    if (path.startsWith('/admin-view-extinguisher/') || path.startsWith('/admin-inspection-label/') || path.startsWith('/admin-assigned-inspections/') || path.startsWith('/super-admin-admin-details/')) return false;

    return true;
  }

  private runCreateIcons(): void {
    const run = () => {
      if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
      }
    };
    setTimeout(run, 0);
    setTimeout(run, 150);
    setTimeout(run, 400);
  }
}


