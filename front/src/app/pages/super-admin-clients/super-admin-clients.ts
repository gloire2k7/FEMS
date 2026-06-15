import { Component, AfterViewInit, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../auth.service';
import { PaginationComponent } from '../../shared/pagination/pagination.component';

declare const lucide: { createIcons: () => void } | undefined;

@Component({
  selector: 'app-super-admin-clients',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PaginationComponent],
  templateUrl: './super-admin-clients.html',
  styleUrl: './super-admin-clients.css',
})
export class SuperAdminClients implements OnInit, AfterViewInit {
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);

  tab: 'pending' | 'active' = 'pending';
  clients: any[] = [];
  loading = true;
  page = 1;
  lastPage = 1;
  total = 0;
  searchQuery = '';

  get filteredClients() {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.clients;
    return this.clients.filter(c =>
      (c.company_name || c.name || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q)
    );
  }

  ngOnInit() {
    const snap = this.route.snapshot.queryParams;
    if (snap['tab'] === 'active' || snap['tab'] === 'pending') {
      this.tab = snap['tab'];
    }
    this.load(1);

    this.route.queryParams.subscribe((params) => {
      const t = params['tab'];
      if ((t === 'active' || t === 'pending') && t !== this.tab) {
        this.tab = t;
        this.load(1);
      }
    });
  }

  ngAfterViewInit() {
    this.refreshIcons();
  }

  switchTab(tab: 'pending' | 'active') {
    this.tab = tab;
    this.load(1);
  }

  load(page: number) {
    this.page = page;
    this.loading = true;
    const req = this.tab === 'pending'
      ? this.auth.getPendingClients(page)
      : this.auth.getClients(page, 'active');

    req.subscribe({
      next: (res) => {
        this.clients = res.data ?? [];
        this.page = res.page ?? page;
        this.lastPage = res.last_page ?? 1;
        this.total = res.total ?? this.clients.length;
        this.loading = false;
        this.refreshIcons();
      },
      error: () => { this.loading = false; },
    });
  }

  approve(c: any) {
    this.auth.approveClient(c.id).subscribe(() => this.load(this.page));
  }

  reject(c: any) {
    this.auth.rejectClient(c.id).subscribe(() => this.load(this.page));
  }

  initials(name: string) {
    return (name || 'C').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  }

  private refreshIcons() {
    setTimeout(() => lucide?.createIcons?.(), 0);
    setTimeout(() => lucide?.createIcons?.(), 120);
  }
}
