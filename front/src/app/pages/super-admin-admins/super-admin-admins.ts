import { Component, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../auth.service';
import { PaginationComponent } from '../../shared/pagination/pagination.component';

declare const lucide: { createIcons: () => void } | undefined;

@Component({
  selector: 'app-super-admin-admins',
  standalone: true,
  imports: [CommonModule, RouterModule, PaginationComponent],
  templateUrl: './super-admin-admins.html',
  styleUrl: './super-admin-admins.css',
})
export class SuperAdminAdmins implements AfterViewInit {
  private auth = inject(AuthService);
  admins: any[] = [];
  page = 1;
  lastPage = 1;
  total = 0;
  activeCount = 0;
  inactiveCount = 0;
  loading = true;
  filter: 'all' | 'active' | 'inactive' = 'all';

  get filteredAdmins() {
    if (this.filter === 'active') return this.admins.filter(a => a.status === 'active');
    if (this.filter === 'inactive') return this.admins.filter(a => a.status !== 'active');
    return this.admins;
  }

  ngAfterViewInit() {
    this.load(1);
  }

  setFilter(f: 'all' | 'active' | 'inactive') {
    this.filter = f;
    this.refreshIcons();
  }

  load(page: number) {
    this.loading = true;
    this.page = page;
    this.auth.getAdmins(page).subscribe({
      next: (res) => {
        this.admins = res.data || [];
        this.page = res.page;
        this.lastPage = res.last_page;
        this.total = res.total;
        this.activeCount = this.admins.filter(a => a.status === 'active').length;
        this.inactiveCount = this.admins.filter(a => a.status !== 'active').length;
        this.loading = false;
        this.refreshIcons();
      },
      error: () => { this.loading = false; },
    });
  }

  toggleStatus(admin: any) {
    const next = admin.status === 'active' ? 'inactive' : 'active';
    this.auth.setAdminStatus(admin.id, next).subscribe(() => this.load(this.page));
  }

  initials(name: string) {
    return (name || 'A').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  }

  private refreshIcons() {
    setTimeout(() => lucide?.createIcons?.(), 0);
    setTimeout(() => lucide?.createIcons?.(), 120);
  }
}
