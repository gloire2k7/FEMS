import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { PaginationComponent } from '../../shared/pagination/pagination.component';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule, RouterModule, PaginationComponent],
  template: `
    <div class="client-page">
      <section class="client-hero">
        <div class="client-hero-inner flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p class="client-hero-eyebrow">Order history</p>
            <h1 class="client-hero-title">My Orders</h1>
            <p class="client-hero-sub">Track review, delivery dates, and confirm when your order arrives.</p>
          </div>
          <a routerLink="/place-order" class="client-hero-btn shrink-0">
            <i data-lucide="clipboard-list" class="w-5 h-5"></i>
            Place order
          </a>
        </div>
      </section>

      <section class="client-stat-grid client-stat-grid--4">
        <a routerLink="/my-orders" [queryParams]="{}" class="client-stat client-stat--primary client-stat-link"
          [class.client-stat-link--active]="!statusFilter">
          <div class="relative z-10 flex items-start justify-between gap-3">
            <div>
              <p class="client-stat-label">All orders</p>
              <p class="client-stat-value">{{ allOrdersCount }}</p>
              <p class="client-stat-hint">Full history</p>
            </div>
            <span class="client-stat-icon"><i data-lucide="package" class="w-5 h-5"></i></span>
          </div>
        </a>
        <a routerLink="/my-orders" [queryParams]="{ status: 'pending' }" class="client-stat client-stat--featured client-stat-link"
          [class.client-stat-link--active]="statusFilter === 'pending'">
          <div class="relative z-10 flex items-start justify-between gap-3">
            <div>
              <p class="client-stat-label">Pending</p>
              <p class="client-stat-value">{{ countByStatus('pending') }}</p>
              <p class="client-stat-hint">Awaiting review</p>
            </div>
            <span class="client-stat-icon"><i data-lucide="clock" class="w-5 h-5"></i></span>
          </div>
        </a>
        <a routerLink="/my-orders" [queryParams]="{ status: 'granted' }" class="client-stat client-stat--success client-stat-link"
          [class.client-stat-link--active]="statusFilter === 'granted'">
          <div class="relative z-10 flex items-start justify-between gap-3">
            <div>
              <p class="client-stat-label">Approved</p>
              <p class="client-stat-value">{{ countByStatus('granted') }}</p>
              <p class="client-stat-hint">Scheduled for delivery</p>
            </div>
            <span class="client-stat-icon"><i data-lucide="check-circle" class="w-5 h-5"></i></span>
          </div>
        </a>
        <a routerLink="/my-orders" [queryParams]="{ status: 'delivered' }" class="client-stat client-stat--info client-stat-link"
          [class.client-stat-link--active]="statusFilter === 'delivered'">
          <div class="relative z-10 flex items-start justify-between gap-3">
            <div>
              <p class="client-stat-label">Delivered</p>
              <p class="client-stat-value">{{ countByStatus('delivered') }}</p>
              <p class="client-stat-hint">Completed</p>
            </div>
            <span class="client-stat-icon"><i data-lucide="truck" class="w-5 h-5"></i></span>
          </div>
        </a>
      </section>

      <div *ngIf="loading" class="text-center py-16 text-base text-slate-400">Loading orders…</div>

      <section *ngIf="!loading && displayOrders.length === 0" class="client-card client-empty">
        <div class="client-empty-icon">
          <i data-lucide="package" class="w-8 h-8"></i>
        </div>
        <p class="text-lg font-semibold text-[#0B1437]">
          {{ statusFilter ? 'No ' + statusLabel(statusFilter).toLowerCase() + ' orders' : 'No orders yet' }}
        </p>
        <p class="text-base text-slate-500 mt-2">
          {{ statusFilter ? 'Try another filter above.' : 'Place an order for the extinguishers you need.' }}
        </p>
        <a routerLink="/place-order" class="client-btn-primary mt-6 inline-flex">Place order</a>
      </section>

      <section id="order-list" *ngIf="!loading && displayOrders.length > 0" class="space-y-5">
        <article *ngFor="let o of displayOrders" class="client-card client-card--lift p-6">
          <div class="flex flex-wrap justify-between gap-4 mb-5">
            <div>
              <p class="text-sm font-semibold text-slate-400 uppercase tracking-wide">
                Order #{{ o.id }}
                <span *ngIf="o.parent_order_id" class="normal-case text-slate-400"> · from #{{ o.parent_order_id }}</span>
              </p>
              <h3 class="text-xl font-bold text-[#0B1437] mt-1">{{ o.type }} · {{ o.capacity }} kg × {{ o.quantity }}</h3>
              <p class="text-base text-slate-500 mt-1">{{ o.created_at | date:'medium' }}</p>
            </div>
            <span class="client-badge h-fit" [ngClass]="statusClass(o.status)">
              {{ statusLabel(o.status) }}
            </span>
          </div>

          <div class="grid sm:grid-cols-2 gap-3 text-base">
            <div><span class="text-slate-500">Total:</span> <span class="font-semibold">{{ o.total_price | number:'1.0-0' }} RWF</span></div>
            <div *ngIf="o.granted_quantity"><span class="text-slate-500">Granted:</span> {{ o.granted_quantity }} unit(s)</div>
            <div *ngIf="o.expected_delivery_date"><span class="text-slate-500">Expected delivery:</span> {{ o.expected_delivery_date | date:'mediumDate' }}</div>
            <div *ngIf="o.delivery_address"><span class="text-slate-500">Delivery:</span> {{ o.delivery_address }}</div>
            <div *ngIf="o.payment_method"><span class="text-slate-500">Payment:</span> {{ o.payment_method }}</div>
            <div *ngIf="o.denial_reason" class="sm:col-span-2 text-red-600 text-base">
              <span class="font-semibold">Denial reason:</span> {{ o.denial_reason }}
            </div>
          </div>

          <div class="mt-6 flex gap-2">
            <div *ngFor="let step of steps" class="flex-1 text-center">
              <div class="h-1.5 rounded-full mb-2"
                [class.bg-emerald-500]="stepDone(o.status, step.key)"
                [class.bg-slate-200]="!stepDone(o.status, step.key)"></div>
              <span class="text-sm font-medium text-slate-500">{{ step.label }}</span>
            </div>
          </div>

          <div *ngIf="o.status === 'granted'" class="mt-6 pt-5 border-t border-slate-100">
            <p class="text-sm text-slate-600 mb-3">Your order has been approved. Confirm delivery once you receive the units.</p>
            <button type="button" (click)="confirmDelivery(o)" [disabled]="confirmingId === o.id"
              class="client-btn-primary px-5 py-2.5 text-sm disabled:opacity-50">
              {{ confirmingId === o.id ? 'Confirming…' : 'Confirm delivery received' }}
            </button>
          </div>
        </article>

        <app-pagination *ngIf="!statusFilter" [page]="page" [lastPage]="lastPage" [total]="total" (pageChange)="load($event)" />
      </section>
    </div>
  `
})
export class MyOrdersComponent implements OnInit {
  private orderService = inject(OrderService);
  private route = inject(ActivatedRoute);
  loading = true;
  ordersList: any[] = [];
  statusFilter = '';
  page = 1;
  lastPage = 1;
  total = 0;
  confirmingId: number | null = null;
  steps = [
    { key: 'pending', label: 'Submitted' },
    { key: 'granted', label: 'Approved' },
    { key: 'delivered', label: 'Delivered' }
  ];

  get displayOrders() {
    if (!this.statusFilter) return this.ordersList;
    return this.ordersList.filter(o => o.status === this.statusFilter);
  }

  get allOrdersCount() {
    return this.total || this.ordersList.length;
  }

  ngOnInit() {
    this.statusFilter = this.route.snapshot.queryParamMap.get('status') || '';
    this.route.queryParamMap.subscribe(params => {
      this.statusFilter = params.get('status') || '';
    });
    this.load(1);
  }

  load(page: number) {
    this.loading = true;
    this.page = page;
    this.orderService.getOrders(page, 50).subscribe({
      next: (res) => {
        this.ordersList = res.data || res;
        this.page = res.page || 1;
        this.lastPage = res.last_page || 1;
        this.total = res.total || this.ordersList.length;
        this.loading = false;
        if (this.statusFilter) {
          setTimeout(() => {
            document.getElementById('order-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);
        }
      },
      error: () => { this.loading = false; }
    });
  }

  confirmDelivery(order: any) {
    this.confirmingId = order.id;
    this.orderService.confirmDelivery(order.id).subscribe({
      next: () => {
        this.confirmingId = null;
        this.load(this.page);
      },
      error: () => {
        this.confirmingId = null;
      },
    });
  }

  countByStatus(status: string) {
    return this.ordersList.filter(o => o.status === status).length;
  }

  statusLabel(s: string) {
    return ({ pending: 'Pending review', granted: 'Approved', cancelled: 'Denied', delivered: 'Delivered' } as any)[s] || s;
  }

  statusClass(s: string) {
    const m: any = {
      pending: 'bg-amber-50 text-amber-700',
      granted: 'bg-emerald-50 text-emerald-700',
      cancelled: 'bg-red-50 text-red-700',
      delivered: 'bg-blue-50 text-blue-700'
    };
    return m[s] || 'bg-slate-100 text-slate-600';
  }

  stepDone(current: string, step: string) {
    const order = ['pending', 'granted', 'delivered'];
    if (current === 'cancelled') return step === 'pending';
    return order.indexOf(current) >= order.indexOf(step);
  }
}
