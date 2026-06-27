import { Component, OnInit, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../app/auth.service';
import { DashboardService } from '../../app/services/dashboard.service';
import { NotificationService } from '../../app/services/notification.service';
import { SidebarStateService } from '../../app/services/sidebar-state.service';
import { NAV_GROUPS, NavGroup, NavItem, REPORTS_ROUTE_SENTINEL } from '../../app/core/nav-registry';

declare const lucide: { createIcons: () => void } | undefined;

@Component({
  selector: 'app-unified-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside
      class="fems-sidebar bg-gradient-to-b from-[#0B1437] to-[#020617] p-4 md:p-5 flex flex-col h-screen shrink-0 overflow-y-auto transition-all duration-300 z-40 fixed lg:static inset-y-0 left-0 -translate-x-full lg:translate-x-0"
      [class.translate-x-0]="sidebar.mobileOpen()"
      [class.w-64]="!sidebar.collapsed() || sidebar.mobileOpen()"
      [class.lg:w-64]="!sidebar.collapsed()"
      [class.lg:w-[4.5rem]]="sidebar.collapsed()"
      [class.is-collapsed]="sidebar.collapsed()">

      <div class="flex items-center gap-2 mb-6 pl-1">
        <div class="w-10 h-10 rounded-xl bg-[#0B1437] ring-1 ring-white/15 flex items-center justify-center shrink-0">
          <i data-lucide="shield" class="w-5 h-5 text-white"></i>
        </div>
        <div *ngIf="!sidebar.collapsed()" class="min-w-0 flex-1">
          <span class="text-2xl font-bold text-white tracking-wide">FEMS</span>
          <p class="text-xs text-slate-400 font-medium">{{ roleLabel }}</p>
        </div>
        <button type="button" (click)="toggleSidebar()" title="Collapse sidebar"
          class="hidden lg:flex p-2 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition-colors shrink-0">
          <i [attr.data-lucide]="sidebar.collapsed() ? 'panel-left-open' : 'panel-left-close'" class="w-4 h-4"></i>
        </button>
        <button type="button" (click)="sidebar.closeMobile()" title="Close menu"
          class="lg:hidden p-2 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition-colors shrink-0">
          <i data-lucide="x" class="w-4 h-4"></i>
        </button>
      </div>

      <nav class="space-y-0.5 text-base flex-1">
        <ng-container *ngFor="let group of groups">
          <ng-container *ngIf="visibleItems(group).length > 0">

            <!-- Collapsible group header (expanded mode, labelled groups only) -->
            <button *ngIf="group.label && !sidebar.collapsed()" type="button" (click)="toggleGroup(group.label)"
              class="w-full flex items-center justify-between gap-2 px-4 pt-5 pb-2 text-sm font-semibold text-slate-500 hover:text-slate-300 uppercase tracking-wider transition-colors">
              <span>{{ group.label }}</span>
              <i [attr.data-lucide]="isOpen(group.label) ? 'chevron-down' : 'chevron-right'" class="w-4 h-4 opacity-70"></i>
            </button>

            <!-- Items: shown when group open, or always in collapsed icon mode / for the label-less group -->
            <ng-container *ngIf="!group.label || sidebar.collapsed() || isOpen(group.label)">
              <a *ngFor="let item of visibleItems(group)"
                [routerLink]="routeFor(item)"
                routerLinkActive="bg-white/10 text-white"
                [routerLinkActiveOptions]="{ exact: !!item.exact }"
                (click)="sidebar.closeMobile()"
                class="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                [class.justify-center]="sidebar.collapsed()" [class.px-3]="sidebar.collapsed()"
                [title]="item.label">
                <i [attr.data-lucide]="item.icon" class="w-5 h-5 shrink-0"></i>
                <span *ngIf="!sidebar.collapsed()" class="font-medium flex-1">{{ item.label }}</span>
                <span *ngIf="!sidebar.collapsed() && badgeFor(item) > 0"
                  class="min-w-[1.25rem] h-5 px-1.5 rounded-full text-white text-xs font-bold flex items-center justify-center"
                  [ngClass]="badgeClass(item)">
                  {{ badgeFor(item) > 9 ? '9+' : badgeFor(item) }}
                </span>
              </a>
            </ng-container>
          </ng-container>
        </ng-container>
      </nav>

      <div class="mt-auto pt-4">
        <div class="bg-white/5 rounded-xl p-3 flex items-center gap-3 border border-white/5"
          [class.justify-center]="sidebar.collapsed()">
          <img [src]="'https://ui-avatars.com/api/?name=' + userName + '&background=3B82F6&color=fff'" alt=""
            class="w-9 h-9 rounded-full shrink-0">
          <div *ngIf="!sidebar.collapsed()" class="min-w-0 flex-1">
            <p class="text-xs text-slate-400">Signed in as</p>
            <p class="text-sm font-semibold text-white truncate">{{ userName }}</p>
          </div>
          <button *ngIf="!sidebar.collapsed()" type="button" (click)="onLogout()" title="Sign out"
            class="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-red-400 transition-colors">
            <i data-lucide="log-out" class="w-5 h-5"></i>
          </button>
        </div>
      </div>
    </aside>
  `,
})
export class UnifiedSidebarComponent implements OnInit, AfterViewInit {
  private auth = inject(AuthService);
  private dashboard = inject(DashboardService);
  private notifications = inject(NotificationService);
  private router = inject(Router);
  protected sidebar = inject(SidebarStateService);

  groups: NavGroup[] = NAV_GROUPS;
  userName = 'User';
  roleLabel = 'Portal';
  pendingOrders = 0;
  pendingClients = 0;

  /** Labels of currently expanded groups. Defaults to the active route's group only. */
  private openGroups = new Set<string>();

  ngOnInit() {
    const user = this.auth.getUser();
    if (user?.name) this.userName = user.name;
    this.roleLabel = user?.role || 'Portal';

    this.auth.user$.subscribe((u) => {
      if (u?.name) this.userName = u.name;
      setTimeout(() => lucide?.createIcons?.(), 50);
    });

    this.dashboard.getStats().subscribe({
      next: (s) => {
        this.pendingOrders = s.pending_orders ?? 0;
        this.pendingClients = s.pending_clients ?? 0;
      },
      error: () => {},
    });

    this.notifications.refreshUnreadCount().subscribe({ error: () => {} });

    this.openActiveGroup(this.router.url);
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.openActiveGroup(e.urlAfterRedirects ?? e.url));
  }

  ngAfterViewInit() {
    setTimeout(() => lucide?.createIcons?.(), 50);
  }

  get unreadNotifications(): number {
    return this.notifications.unreadCount();
  }

  visibleItems(group: NavGroup): NavItem[] {
    return group.items.filter((i) => !i.anyOf || i.anyOf.length === 0 || this.auth.hasAnyPermission(i.anyOf));
  }

  routeFor(item: NavItem): string {
    return item.route === REPORTS_ROUTE_SENTINEL ? this.auth.reportsRoute() : item.route;
  }

  toggleGroup(label: string) {
    if (this.openGroups.has(label)) {
      this.openGroups.delete(label);
    } else {
      this.openGroups.add(label);
    }
    setTimeout(() => lucide?.createIcons?.(), 30);
  }

  isOpen(label: string): boolean {
    return this.openGroups.has(label);
  }

  /** Expand the group that owns the active route so the current page is always visible. */
  private openActiveGroup(url: string) {
    const path = (url ?? '').split('?')[0].split('#')[0];
    for (const group of this.groups) {
      if (!group.label) continue;
      const match = this.visibleItems(group).some((item) => {
        const route = this.routeFor(item);
        return route !== '/dashboard' && (path === route || path.startsWith(route + '/'));
      });
      if (match) {
        this.openGroups.add(group.label);
      }
    }
    setTimeout(() => lucide?.createIcons?.(), 30);
  }

  badgeFor(item: NavItem): number {
    if (item.badge === 'orders') return this.pendingOrders;
    if (item.badge === 'clients') return this.pendingClients;
    if (item.badge === 'notifications') return this.unreadNotifications;
    return 0;
  }

  badgeClass(item: NavItem): string {
    if (item.badge === 'orders') return 'bg-orange-500';
    if (item.badge === 'clients') return 'bg-amber-500';
    return 'bg-red-500';
  }

  toggleSidebar() {
    this.sidebar.toggle();
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
