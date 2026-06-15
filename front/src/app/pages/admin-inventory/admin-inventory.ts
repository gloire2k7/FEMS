import { Component, AfterViewInit, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StockService } from '../../services/stock.service';
import { AuthService } from '../../auth.service';
import { PaginationComponent } from '../../shared/pagination/pagination.component';

declare const lucide: { createIcons: () => void } | undefined;

@Component({
  selector: 'app-admin-inventory',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink, RouterLinkActive, FormsModule, PaginationComponent],
  templateUrl: './admin-inventory.html',
  styleUrl: './admin-inventory.css',
})
export class AdminInventoryComponent implements OnInit, AfterViewInit {
  private stock = inject(StockService);
  private auth = inject(AuthService);
  private router = inject(Router);

  inspectionsOpen = false;
  summary: any = null;
  recent: any[] = [];
  recentPage = 1;
  recentLastPage = 1;
  recentTotal = 0;

  units: any[] = [];
  page = 1;
  lastPage = 1;
  total = 0;

  statusFilter: 'in_stock' | 'allocated' | 'all' = 'in_stock';
  sortOrder: 'newest' | 'oldest' = 'newest';

  loading = true;
  canManage = false;

  ngOnInit() {
    this.canManage = this.auth.isRole('Super Admin') || this.auth.hasPermission('manage_inventory');
    this.loadRecent(1);
    this.loadUnits(1);
  }

  ngAfterViewInit() {
    this.initIcons();
  }

  loadRecent(page: number) {
    this.recentPage = page;
    this.stock.getSummary(page).subscribe({
      next: (res) => {
        this.summary = res.summary;
        const r = res.recent;
        this.recent = r.data || [];
        this.recentPage = r.page || 1;
        this.recentLastPage = r.last_page || 1;
        this.recentTotal = r.total || 0;
        setTimeout(() => this.initIcons(), 50);
      }
    });
  }

  loadUnits(page: number) {
    this.page = page;
    this.loading = true;
    this.stock.getUnits(page, this.statusFilter, this.sortOrder).subscribe({
      next: (res) => {
        this.units = res.data || [];
        this.page = res.page || 1;
        this.lastPage = res.last_page || 1;
        this.total = res.total || 0;
        this.loading = false;
        setTimeout(() => this.initIcons(), 50);
      },
      error: () => { this.loading = false; }
    });
  }

  setFilter(filter: 'in_stock' | 'allocated' | 'all') {
    if (this.statusFilter === filter) return;
    this.statusFilter = filter;
    this.loadUnits(1);
  }

  setSort(sort: 'newest' | 'oldest') {
    if (this.sortOrder === sort) return;
    this.sortOrder = sort;
    this.loadUnits(1);
  }

  goRegister() {
    this.router.navigate(['/admin-add-extinguisher']);
  }

  qrUrl(path: string) {
    return path ? `http://localhost:8000${path}` : '';
  }

  private initIcons() {
    [0, 100, 300].forEach(d => setTimeout(() => lucide?.createIcons?.(), d));
  }
}
