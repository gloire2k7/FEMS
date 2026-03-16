import { Component, AfterViewInit, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../services/order.service';

declare const lucide: { createIcons: (opts?: { nameAttr?: string }) => void } | undefined;

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './admin-orders.html',
  styleUrl: './admin-orders.css',
})
export class AdminOrders implements AfterViewInit, OnInit {
  private orderService = inject(OrderService);

  inspectionsOpen = false;
  searchQuery = '';
  filterStatus = 'all';
  isLoading = false;

  allOrders: any[] = [];
  protected Math = Math;

  // Pagination
  currentPage = 1;
  pageSize = 10;

  // Modal state
  showDenialModal = false;
  orderToDeny: any = null;
  selectedReason = '';
  customReason = '';

  // Approve state
  approvingId: number | null = null;
  approvalResult: { orderId: number, zip_url: string | null, units: string[] } | null = null;
  showApprovalModal = false;

  denialReasons = [
    { value: 'out_of_stock', label: 'Out of Stock' },
    { value: 'payment_issue', label: 'Payment Issue' },
    { value: 'invalid_order', label: 'Invalid Order Details' },
    { value: 'product_discontinued', label: 'Product Discontinued' },
    { value: 'other', label: 'Other (specify below)' },
  ];

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.isLoading = true;
    this.orderService.getOrders().subscribe({
      next: (data) => {
        this.allOrders = data;
        this.isLoading = false;
        this.initIcons();
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  toggleInspections() {
    this.inspectionsOpen = !this.inspectionsOpen;
    this.initIcons();
  }

  get filteredOrders() {
    return this.allOrders.filter(o => {
      const q = this.searchQuery.toLowerCase();
      const matchSearch = !q || o.id?.toString().includes(q) || o.client_name?.toLowerCase().includes(q) || o.type?.toLowerCase().includes(q);
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

  get pendingCount() { return this.allOrders.filter(o => o.status === 'pending').length; }
  get grantedCount() { return this.allOrders.filter(o => o.status === 'granted').length; }
  get cancelledCount() { return this.allOrders.filter(o => o.status === 'cancelled').length; }

  approveOrder(order: any) {
    this.approvingId = order.id;
    this.orderService.approveOrder(order.id).subscribe({
      next: (res) => {
        this.approvingId = null;
        this.approvalResult = {
          orderId: order.id,
          zip_url: res.labels_zip ? `http://localhost:8000${res.labels_zip}` : null,
          units: res.units_assigned || []
        };
        this.showApprovalModal = true;
        this.loadOrders(); // Refresh
        this.initIcons();
      },
      error: (err) => {
        this.approvingId = null;
        alert(err?.error?.message || 'Approval failed');
      }
    });
  }

  downloadZip() {
    if (this.approvalResult?.zip_url) {
      window.open(this.approvalResult.zip_url, '_blank');
    }
  }

  closeApprovalModal() {
    this.showApprovalModal = false;
    this.approvalResult = null;
  }

  openDenyModal(order: any) {
    this.orderToDeny = order;
    this.selectedReason = '';
    this.customReason = '';
    this.showDenialModal = true;
    setTimeout(() => this.initIcons(), 100);
  }

  closeDenyModal() {
    this.showDenialModal = false;
    this.orderToDeny = null;
  }

  confirmDeny() {
    if (!this.orderToDeny) return;
    this.orderService.denyOrder(this.orderToDeny.id).subscribe({
      next: () => {
        this.closeDenyModal();
        this.loadOrders();
      },
      error: (err) => alert(err?.error?.message || 'Failed to deny order')
    });
  }

  get canConfirmDeny(): boolean {
    if (!this.selectedReason) return false;
    if (this.selectedReason === 'other' && !this.customReason.trim()) return false;
    return true;
  }

  getStatusClass(status: string) {
    switch (status) {
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'granted': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  }

  ngAfterViewInit() { this.initIcons(); }

  private initIcons() {
    const run = () => { if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons(); };
    run();
    [100, 300, 600, 1000].forEach(d => setTimeout(run, d));
  }
}
