import { Component, AfterViewInit, OnInit, inject } from '@angular/core';
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
export class SuperAdminAdmins implements OnInit, AfterViewInit {
  private auth = inject(AuthService);
  admins: any[] = [];
  page = 1;
  lastPage = 1;
  total = 0;
  loading = true;
  filter: 'all' | 'active' | 'inactive' = 'all';
  private loadRequestId = 0;

  ngOnInit() {
    this.load(1);
  }

  ngAfterViewInit() {
    this.refreshIcons();
  }

  setFilter(f: 'all' | 'active' | 'inactive') {
    if (this.filter === f && !this.loading) {
      this.load(1);
      return;
    }
    this.filter = f;
    this.admins = [];
    this.load(1);
  }

  load(page: number) {
    const requestId = ++this.loadRequestId;
    this.loading = true;
    this.page = page;
    const status = this.filter === 'all' ? undefined : this.filter;

    this.auth.getAdmins(page, status).subscribe({
      next: (res) => {
        if (requestId !== this.loadRequestId) return;
        this.admins = res.data || [];
        this.page = res.page;
        this.lastPage = res.last_page;
        this.total = res.total;
        this.loading = false;
        this.refreshIcons();
      },
      error: () => {
        if (requestId !== this.loadRequestId) return;
        this.loading = false;
      },
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
