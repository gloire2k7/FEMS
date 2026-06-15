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
    <div class="max-w-5xl mx-auto p-6 space-y-6">
      <div>
        <h1 class="text-2xl font-black text-[#0B1437]">My Orders</h1>
        <p class="text-sm text-slate-500 mt-1">Track approval, delivery, and status of your requests</p>
      </div>

      <div *ngIf="loading" class="text-center py-12 text-slate-400">Loading orders…</div>

      <div *ngIf="!loading && orders.length === 0"
        class="bg-white rounded-2xl border border-slate-100 p-12 text-center">
        <p class="text-slate-500 mb-4">No orders yet.</p>
        <a routerLink="/shop" class="inline-block px-6 py-2 bg-[#0B1437] text-white rounded-xl text-sm font-bold">Browse Shop</a>
      </div>

      <div *ngFor="let o of orders" class="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <div class="flex flex-wrap justify-between gap-4 mb-4">
          <div>
            <p class="text-xs font-bold text-slate-400 uppercase">Order #{{ o.id }}</p>
            <h3 class="text-lg font-black text-[#0B1437]">{{ o.type }} · {{ o.capacity }} × {{ o.quantity }}</h3>
            <p class="text-sm text-slate-500 mt-1">{{ o.created_at | date:'medium' }}</p>
          </div>
          <span [class]="statusClass(o.status)" class="px-4 py-1.5 rounded-full text-xs font-black uppercase h-fit">
            {{ statusLabel(o.status) }}
          </span>
        </div>
        <div class="grid sm:grid-cols-2 gap-3 text-sm">
          <div><span class="text-slate-400 font-semibold">Total:</span> {{ o.total_price | currency }}</div>
          <div *ngIf="o.delivery_address"><span class="text-slate-400 font-semibold">Delivery:</span> {{ o.delivery_address }}</div>
          <div *ngIf="o.payment_method"><span class="text-slate-400 font-semibold">Payment:</span> {{ o.payment_method }}</div>
          <div *ngIf="o.denial_reason" class="sm:col-span-2 text-red-600"><span class="font-semibold">Denial reason:</span> {{ o.denial_reason }}</div>
        </div>
        <div class="mt-4 flex gap-2">
          <div *ngFor="let step of steps" class="flex-1 text-center">
            <div class="h-1 rounded-full mb-1" [class.bg-emerald-500]="stepDone(o.status, step.key)" [class.bg-slate-200]="!stepDone(o.status, step.key)"></div>
            <span class="text-[10px] font-bold text-slate-500">{{ step.label }}</span>
          </div>
        </div>
      </div>

      <app-pagination [page]="page" [lastPage]="lastPage" [total]="total" (pageChange)="load($event)" />
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
    return ({ pending: 'Pending Review', granted: 'Approved', cancelled: 'Denied', delivered: 'Delivered' } as any)[s] || s;
  }

  statusClass(s: string) {
    const m: any = {
      pending: 'bg-amber-100 text-amber-700',
      granted: 'bg-emerald-100 text-emerald-700',
      cancelled: 'bg-red-100 text-red-700',
      delivered: 'bg-blue-100 text-blue-700'
    };
    return m[s] || 'bg-slate-100 text-slate-600';
  }

  stepDone(current: string, step: string) {
    const order = ['pending', 'granted', 'delivered'];
    if (current === 'cancelled') return step === 'pending';
    return order.indexOf(current) >= order.indexOf(step);
  }
}
