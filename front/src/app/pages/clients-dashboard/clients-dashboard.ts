import { Component, AfterViewInit, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../auth.service';
import { PaginationComponent } from '../../shared/pagination/pagination.component';

declare const lucide: { createIcons: () => void } | undefined;

@Component({
  selector: 'app-clients-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PaginationComponent],
  templateUrl: './clients-dashboard.html',
  styleUrl: './clients-dashboard.css',
})
export class ClientsDashboard implements OnInit, AfterViewInit {
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

  ngOnInit() {
    const snapTab = this.route.snapshot.queryParams['tab'];
    if (snapTab === 'active' || snapTab === 'pending') {
      this.tab = snapTab;
    }
    this.load(1);

    this.route.queryParams.subscribe((params) => {
      const t = params['tab'];
      const newTab: 'pending' | 'active' = t === 'active' ? 'active' : 'pending';
      if (newTab !== this.tab) {
        this.tab = newTab;
        this.clients = [];
        this.load(1);
      }
    });
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
        this.clients = res.data ?? res ?? [];
        this.page = res.page ?? page;
        this.lastPage = res.last_page ?? 1;
        this.total = res.total ?? this.clients.length;
        this.loading = false;
        this.refreshIcons();
      },
      error: () => {
        if (requestId !== this.loadRequestId) return;
        this.loading = false;
        this.refreshIcons();
      },
    });
  }

  get filteredClients() {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.clients;
    return this.clients.filter((c) =>
      (c.company_name || c.name || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q)
    );
  }

  processing = new Set<number>();

  isProcessing(id: number) {
    return this.processing.has(id);
  }

  approve(client: any) {
    if (this.processing.has(client.id)) return;
    this.processing.add(client.id);
    this.auth.approveClient(client.id).subscribe({
      next: () => {
        this.processing.delete(client.id);
        this.load(this.page);
      },
      error: () => this.processing.delete(client.id),
    });
  }

  reject(client: any) {
    if (this.processing.has(client.id)) return;
    this.processing.add(client.id);
    this.auth.rejectClient(client.id).subscribe({
      next: () => {
        this.processing.delete(client.id);
        this.load(this.page);
      },
      error: () => this.processing.delete(client.id),
    });
  }

  resendCredentials(client: any) {
    if (this.processing.has(client.id)) return;
    if (!confirm(`Generate a new password for ${client.company_name || client.name} and email it to ${client.email}? Their current password will stop working.`)) {
      return;
    }
    this.processing.add(client.id);
    this.auth.resendClientCredentials(client.id).subscribe({
      next: (res) => {
        this.processing.delete(client.id);
        alert(res?.message || 'New credentials sent by email.');
      },
      error: (err) => {
        this.processing.delete(client.id);
        alert(err?.error?.message || 'Could not resend credentials.');
      },
    });
  }

  initials(name: string): string {
    return (name || 'C').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  }

  ngAfterViewInit() {
    this.refreshIcons();
  }

  private refreshIcons() {
    setTimeout(() => lucide?.createIcons?.(), 0);
    setTimeout(() => lucide?.createIcons?.(), 120);
  }
}
