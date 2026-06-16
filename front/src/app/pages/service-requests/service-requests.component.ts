import { AfterViewInit, Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ServiceRequestService } from '../../services/service-request.service';
import { PaginationComponent } from '../../shared/pagination/pagination.component';

declare const lucide: { createIcons: () => void } | undefined;

type TypeFilter = 'all' | 'inspection' | 'refill' | 'maintenance';

@Component({
  selector: 'app-service-requests',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule, PaginationComponent],
  template: `
    <div class="client-page">
      <section class="client-hero">
        <div class="client-hero-inner flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p class="client-hero-eyebrow">Maintenance</p>
            <h1 class="client-hero-title">Service Requests</h1>
            <p class="client-hero-sub">Request inspection, refill, or maintenance and track progress.</p>
          </div>
          <button type="button" (click)="openModal()" class="client-hero-btn shrink-0">
            <i data-lucide="plus" class="w-5 h-5"></i>
            New request
          </button>
        </div>
      </section>

      <section class="client-card p-5 mb-5 flex flex-wrap gap-3 items-center">
        <span class="text-sm font-medium text-slate-500">Filter:</span>
        <button *ngFor="let f of typeFilters" type="button" (click)="setFilter(f.value)"
          class="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          [class.bg-[#0B1437]]="typeFilter === f.value" [class.text-white]="typeFilter === f.value"
          [class.bg-slate-100]="typeFilter !== f.value" [class.text-slate-600]="typeFilter !== f.value">
          {{ f.label }}
        </button>
      </section>

      <section class="client-card overflow-hidden">
        <div *ngIf="loading" class="client-empty py-12 text-slate-400">Loading requests…</div>
        <div *ngIf="!loading && requests.length === 0" class="client-empty py-12">
          <p class="text-lg font-semibold text-[#0B1437]">No requests yet</p>
          <p class="text-base text-slate-500 mt-2">Submit a request to get started.</p>
          <button type="button" (click)="openModal()" class="client-btn-primary mt-6">New request</button>
        </div>
        <div *ngIf="!loading && requests.length" class="client-table-wrap">
          <table class="client-table">
            <thead>
              <tr>
                <th>Serial</th>
                <th>Type</th>
                <th>Status</th>
                <th>Preferred</th>
                <th>Confirmed</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let r of requests">
                <td class="font-semibold">{{ r.serial_number }}</td>
                <td class="capitalize">{{ r.service_type }}</td>
                <td><span class="client-badge" [ngClass]="statusClass(r.status)">{{ statusLabel(r.status) }}</span></td>
                <td>{{ r.preferred_date ? (r.preferred_date | date:'mediumDate') : '—' }}</td>
                <td>{{ r.confirmed_date ? (r.confirmed_date | date:'mediumDate') : '—' }}</td>
                <td class="text-right">
                  <button *ngIf="r.status === 'awaiting_client'" type="button" (click)="confirmDone(r.id)"
                    class="client-btn-primary text-xs px-3 py-1.5">Confirm done</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="px-5 pb-2" *ngIf="!loading && total > 0">
          <app-pagination [page]="page" [lastPage]="lastPage" [total]="total" (pageChange)="load($event)" />
        </div>
      </section>

      <div *ngIf="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-[#0B1437]/50 backdrop-blur-sm" (click)="closeModal()"></div>
        <div class="relative client-card w-full max-w-lg p-8 shadow-xl">
          <button type="button" (click)="closeModal()"
            class="absolute top-4 right-4 w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
          <h2 class="text-2xl font-bold text-[#0B1437] mb-1">New service request</h2>
          <p class="text-base text-slate-500 mb-6">Request inspection, refill, or maintenance for one of your units.</p>
          <p *ngIf="submitError" class="text-sm text-red-600 mb-4">{{ submitError }}</p>
          <form class="space-y-5" (ngSubmit)="submitRequest()">
            <div>
              <label class="client-label">Extinguisher serial *</label>
              <input type="text" [(ngModel)]="form.serial_number" name="serial" placeholder="FEMS-20260616-05ED2" class="client-input" required />
            </div>
            <div>
              <label class="client-label">Service type *</label>
              <select [(ngModel)]="form.service_type" name="serviceType" class="client-input" required>
                <option value="">Select…</option>
                <option value="inspection">Inspection</option>
                <option value="refill">Refill</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <div>
              <label class="client-label">Preferred date</label>
              <input type="date" [(ngModel)]="form.preferred_date" name="preferredDate" class="client-input" />
            </div>
            <div>
              <label class="client-label">Notes</label>
              <textarea [(ngModel)]="form.client_notes" name="notes" rows="3" class="client-input resize-none"
                placeholder="Describe the issue or special instructions…"></textarea>
            </div>
            <div class="flex gap-3 pt-2">
              <button type="button" (click)="closeModal()" class="client-btn-secondary flex-1">Cancel</button>
              <button type="submit" [disabled]="submitting" class="client-btn-primary flex-1 disabled:opacity-40">Submit</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class ServiceRequestsComponent implements OnInit, AfterViewInit {
  private svc = inject(ServiceRequestService);
  private cdr = inject(ChangeDetectorRef);

  loading = true;
  requests: any[] = [];
  page = 1;
  lastPage = 1;
  total = 0;
  typeFilter: TypeFilter = 'all';
  showModal = false;
  submitting = false;
  submitError = '';

  typeFilters = [
    { value: 'all' as TypeFilter, label: 'All' },
    { value: 'inspection' as TypeFilter, label: 'Inspection' },
    { value: 'refill' as TypeFilter, label: 'Refill' },
    { value: 'maintenance' as TypeFilter, label: 'Maintenance' },
  ];

  form = { serial_number: '', service_type: '', preferred_date: '', client_notes: '' };

  ngOnInit() { this.load(1); }

  load(page: number) {
    this.loading = true;
    this.page = page;
    this.svc.getMyRequests(page, 5, this.typeFilter === 'all' ? undefined : this.typeFilter).subscribe({
      next: (res) => {
        this.requests = res.data ?? [];
        this.total = res.total ?? 0;
        this.lastPage = res.last_page ?? 1;
        this.loading = false;
        this.cdr.detectChanges();
        this.refreshIcons();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  setFilter(f: TypeFilter) {
    this.typeFilter = f;
    this.load(1);
  }

  statusLabel(s: string) {
    return ({ pending: 'Pending', scheduled: 'Scheduled', awaiting_client: 'Awaiting your confirmation', completed: 'Completed' } as any)[s] || s;
  }

  statusClass(s: string) {
    if (s === 'completed') return 'bg-emerald-50 text-emerald-700';
    if (s === 'awaiting_client') return 'bg-blue-50 text-blue-700';
    if (s === 'scheduled') return 'bg-amber-50 text-amber-700';
    return 'bg-slate-100 text-slate-600';
  }

  openModal() { this.showModal = true; setTimeout(() => this.refreshIcons(), 50); }
  closeModal() { this.showModal = false; this.form = { serial_number: '', service_type: '', preferred_date: '', client_notes: '' }; this.submitError = ''; }

  submitRequest() {
    if (!this.form.serial_number.trim() || !this.form.service_type) return;
    this.submitting = true;
    this.submitError = '';
    this.svc.createRequest({
      serial_number: this.form.serial_number.trim(),
      service_type: this.form.service_type,
      preferred_date: this.form.preferred_date || undefined,
      client_notes: this.form.client_notes || undefined,
    }).subscribe({
      next: () => { this.submitting = false; this.closeModal(); this.load(1); },
      error: (err) => {
        this.submitError = err.error?.message || 'Failed to submit request.';
        this.submitting = false;
        this.cdr.detectChanges();
      }
    });
  }

  confirmDone(id: number) {
    if (!confirm('Confirm this service was completed to your satisfaction?')) return;
    this.svc.confirmDone(id).subscribe({ next: () => this.load(this.page) });
  }

  ngAfterViewInit() { this.refreshIcons(); }
  private refreshIcons() { lucide?.createIcons?.(); }
}
