import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs/operators';

declare const lucide: { createIcons(): void };

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class SidebarComponent implements AfterViewInit, OnDestroy {
  /** Role-scoped destinations for shared (client layout) sidebar. */
  clientsLink: string = '/client-clients';
  settingsLink: string = '/settings';

  private unsubscribeFromRouterEvents?: () => void;

  constructor(private router: Router) {
    const sub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.updateRoleScopedLinks(e.urlAfterRedirects ?? e.url);
      });
    this.unsubscribeFromRouterEvents = () => sub.unsubscribe();

    this.updateRoleScopedLinks(this.router.url);
  }

  ngAfterViewInit(): void {
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  ngOnDestroy(): void {
    this.unsubscribeFromRouterEvents?.();
  }

  private updateRoleScopedLinks(rawUrl: string): void {
    const path = (rawUrl ?? '').split('?')[0].split('#')[0];

    if (path.startsWith('/super-admin-') || path === '/super-admin-dashboard') {
      // Super Admin should stay within Super Admin module pages.
      this.clientsLink = '/super-admin-clients';
      // No dedicated super-admin settings route exists in this app; avoid sending to client settings.
      this.settingsLink = '/super-admin-dashboard';
      return;
    }

    if (path.startsWith('/admin-') || path === '/admin-dashboard' || path === '/clients') {
      // Admin should stay within Admin module pages.
      this.clientsLink = '/clients';
      this.settingsLink = '/admin-settings';
      return;
    }

    // Default: Client module.
    this.clientsLink = '/client-clients';
    this.settingsLink = '/settings';
  }
}
