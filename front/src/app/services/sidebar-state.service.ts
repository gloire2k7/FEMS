import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SidebarStateService {
  private readonly storageKey = 'fems-sidebar-collapsed';

  readonly collapsed = signal(localStorage.getItem(this.storageKey) === '1');
  readonly mobileOpen = signal(false);

  toggle() {
    this.collapsed.update(v => {
      const next = !v;
      localStorage.setItem(this.storageKey, next ? '1' : '0');
      return next;
    });
  }

  openMobile() {
    this.mobileOpen.set(true);
  }

  closeMobile() {
    this.mobileOpen.set(false);
  }

  toggleMobile() {
    this.mobileOpen.update(v => !v);
  }
}
