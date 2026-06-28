import { Component, AfterViewInit, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
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
  private router = inject(Router);

  tab: 'pending' | 'active' = 'pending';
  clients: any[] = [];
  loading = true;
  page = 1;
  lastPage = 1;
  total = 0;
  searchQuery = '';
  private loadRequestId = 0;

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
    const snapTab = this.route.snapshot.queryParamMap.get('tab');
    if (snapTab === 'active' || snapTab === 'pending') {
      this.tab = snapTab;
    }
    this.load(1);

    this.route.queryParamMap.subscribe((params) => {
      const t = params.get('tab');
      const newTab: 'pending' | 'active' = t === 'active' ? 'active' : 'pending';
      if (newTab !== this.tab) {
        this.tab = newTab;
        this.clients = [];
        this.load(1);
      }
    });
  }

  ngAfterViewInit() {
    this.refreshIcons();
  }

  switchTab(tab: 'pending' | 'active') {
    if (this.tab === tab) {
      this.load(1);
      return;
    }
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge',
    });
  }

  load(page: number) {
    const requestId = ++this.loadRequestId;
    this.page = page;
    this.loading = true;
    const req = this.tab === 'pending'
      ? this.auth.getPendingClients(page)
      : this.auth.getClients(page, 'active');

    req.subscribe({
      next: (res) => {
        if (requestId !== this.loadRequestId) return;
        this.clients = res.data ?? [];
        this.page = res.page ?? page;
        this.lastPage = res.last_page ?? 1;
        this.total = res.total ?? this.clients.length;
        this.loading = false;
        this.refreshIcons();
      },
      error: () => {
        if (requestId !== this.loadRequestId) return;
        this.loading = false;
      },
    });
  }

  processing = new Set<number>();

  isProcessing(id: number) {
    return this.processing.has(id);
  }

  approve(c: any) {
    if (this.processing.has(c.id)) return;
    this.processing.add(c.id);
    this.auth.approveClient(c.id).subscribe({
      next: () => {
        this.processing.delete(c.id);
        this.load(this.page);
      },
      error: () => this.processing.delete(c.id),
    });
  }

  reject(c: any) {
    if (this.processing.has(c.id)) return;
    this.processing.add(c.id);
    this.auth.rejectClient(c.id).subscribe({
      next: () => {
        this.processing.delete(c.id);
        this.load(this.page);
      },
      error: () => this.processing.delete(c.id),
    });
  }

  resendCredentials(c: any) {
    if (this.processing.has(c.id)) return;
    if (!confirm(`Generate a new password for ${c.company_name || c.name} and email it to ${c.email}? Their current password will stop working.`)) {
      return;
    }
    this.processing.add(c.id);
    this.auth.resendClientCredentials(c.id).subscribe({
      next: (res) => {
        this.processing.delete(c.id);
        alert(res?.message || 'New credentials sent by email.');
      },
      error: (err) => {
        this.processing.delete(c.id);
        alert(err?.error?.message || 'Could not resend credentials.');
      },
    });
  }

  initials(name: string) {
    return (name || 'C').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  }

  private refreshIcons() {
    setTimeout(() => lucide?.createIcons?.(), 0);
    setTimeout(() => lucide?.createIcons?.(), 120);
  }
}
