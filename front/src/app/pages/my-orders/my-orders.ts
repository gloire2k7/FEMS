import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
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
            <p class="client-hero-sub">Track approval, delivery, and status of your orders.</p>
          </div>
          <a routerLink="/shop" class="client-hero-btn shrink-0">
            <i data-lucide="shopping-bag" class="w-5 h-5"></i>
            New order
          </a>
        </div>
      </section>

      <div *ngIf="loading" class="text-center py-16 text-base text-slate-400">Loading orders…</div>

      <section *ngIf="!loading && orders.length === 0" class="client-card client-empty">
        <div class="client-empty-icon">
          <i data-lucide="package" class="w-8 h-8"></i>
        </div>
        <p class="text-lg font-semibold text-[#0B1437]">No orders yet</p>
        <p class="text-base text-slate-500 mt-2">Browse the shop to place your first order.</p>
        <a routerLink="/shop" class="client-btn-primary mt-6 inline-flex">Browse shop</a>
      </section>

      <section *ngIf="!loading && orders.length > 0" class="space-y-5">
        <article *ngFor="let o of orders" class="client-card client-card--lift p-6">
          <div class="flex flex-wrap justify-between gap-4 mb-5">
            <div>
              <p class="text-sm font-semibold text-slate-400 uppercase tracking-wide">Order #{{ o.id }}</p>
              <h3 class="text-xl font-bold text-[#0B1437] mt-1">{{ o.type }} · {{ o.capacity }} × {{ o.quantity }}</h3>
              <p class="text-base text-slate-500 mt-1">{{ o.created_at | date:'medium' }}</p>
            </div>
            <span class="client-badge h-fit" [ngClass]="statusClass(o.status)">
              {{ statusLabel(o.status) }}
            </span>
          </div>

          <div class="grid sm:grid-cols-2 gap-3 text-base">
            <div><span class="text-slate-500">Total:</span> <span class="font-semibold">{{ o.total_price | currency }}</span></div>
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
        </article>

        <app-pagination [page]="page" [lastPage]="lastPage" [total]="total" (pageChange)="load($event)" />
      </section>
    </div>
  `
})
export class MyOrdersComponent implements OnInit {
  private orderService = inject(OrderService);
  loading = true;
  ordersList: any[] = [];
  get orders() { return this.ordersList; }
  page = 1;
  lastPage = 1;
  total = 0;
  steps = [
    { key: 'pending', label: 'Submitted' },
    { key: 'granted', label: 'Approved' },
    { key: 'delivered', label: 'Delivered' }
  ];

  ngOnInit() { this.load(1); }

  load(page: number) {
    this.loading = true;
    this.page = page;
    this.orderService.getOrders(page, 10).subscribe({
      next: (res) => {
        this.ordersList = res.data || res;
        this.page = res.page || 1;
        this.lastPage = res.last_page || 1;
        this.total = res.total || this.ordersList.length;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
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
