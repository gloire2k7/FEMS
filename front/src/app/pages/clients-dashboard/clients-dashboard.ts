import { Component, AfterViewInit, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
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

  tab: 'pending' | 'active' = 'pending';
  clients: any[] = [];
  loading = true;
  page = 1;
  lastPage = 1;
  total = 0;
  searchQuery = '';

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      if (params['tab'] === 'active' || params['tab'] === 'pending') {
        this.tab = params['tab'];
      }
      this.load(1);
    });
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
        this.clients = res.data ?? res ?? [];
        this.page = res.page ?? page;
        this.lastPage = res.last_page ?? 1;
        this.total = res.total ?? this.clients.length;
        this.loading = false;
        this.refreshIcons();
      },
      error: () => {
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

  approve(client: any) {
    this.auth.approveClient(client.id).subscribe(() => this.load(this.page));
  }

  reject(client: any) {
    this.auth.rejectClient(client.id).subscribe(() => this.load(this.page));
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
