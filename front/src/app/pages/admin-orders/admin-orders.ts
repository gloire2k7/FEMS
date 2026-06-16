import { Component, AfterViewInit, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../services/order.service';

declare const lucide: { createIcons: (opts?: { nameAttr?: string }) => void } | undefined;

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-orders.html',
  styleUrl: './admin-orders.css',
})
export class AdminOrders implements AfterViewInit, OnInit {
  private orderService = inject(OrderService);
  private route = inject(ActivatedRoute);

  searchQuery = '';
  filterStatus = 'all';
  isLoading = false;

  allOrders: any[] = [];
  protected Math = Math;

  currentPage = 1;
  pageSize = 10;

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      const status = params['status'];
      if (status && ['pending', 'granted', 'cancelled', 'all'].includes(status)) {
        this.filterStatus = status;
      }
      this.loadOrders();
    });
  }

  loadOrders() {
    this.isLoading = true;
    this.orderService.getOrders(1, 200).subscribe({
      next: (res) => {
        this.allOrders = res.data || res || [];
        this.isLoading = false;
        this.initIcons();
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  get filteredOrders() {
    return this.allOrders.filter((o) => {
      const q = this.searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        o.id?.toString().includes(q) ||
        o.client_name?.toLowerCase().includes(q) ||
        o.type?.toLowerCase().includes(q);
      const matchStatus = this.filterStatus === 'all' || o.status === this.filterStatus;
      return matchSearch && matchStatus;
    });
  }

  get paginatedOrders() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredOrders.slice(start, start + this.pageSize);
  }

  get totalPages() {
    return Math.ceil(this.filteredOrders.length / this.pageSize) || 1;
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) this.currentPage = page;
  }

  get pendingCount() {
    return this.allOrders.filter((o) => o.status === 'pending').length;
  }
  get grantedCount() {
    return this.allOrders.filter((o) => o.status === 'granted').length;
  }
  get cancelledCount() {
    return this.allOrders.filter((o) => o.status === 'cancelled').length;
  }

  getStatusClass(status: string) {
    switch (status) {
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'granted':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-100';
      case 'delivered':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  }

  ngAfterViewInit() {
    this.initIcons();
  }

  private initIcons() {
    const run = () => {
      if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
    };
    run();
    [100, 300, 600, 1000].forEach((d) => setTimeout(run, d));
  }
}
