import { AfterViewInit, Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ServiceRequestService } from '../../services/service-request.service';
import { PaginationComponent } from '../../shared/pagination/pagination.component';

declare const lucide: { createIcons: () => void } | undefined;

type TypeFilter = 'all' | 'inspection' | 'refill' | 'maintenance' | 'mandatory';

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
            <p class="client-hero-sub">Request services for multiple units at once and track progress.</p>
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
        <div *ngIf="!loading && isEmpty" class="client-empty py-12">
          <p class="text-lg font-semibold text-[#0B1437]">No requests yet</p>
          <button type="button" (click)="openModal()" class="client-btn-primary mt-6">New request</button>
        </div>

        <div *ngIf="!loading && typeFilter !== 'mandatory' && batches.length" class="divide-y divide-slate-100">
          <div *ngFor="let b of batches" class="p-5">
            <div class="flex flex-wrap justify-between gap-3 mb-2">
              <div>
                <p class="font-semibold text-[#0B1437] capitalize">{{ b.service_type }} · {{ b.unit_count }} unit(s)</p>
                <p class="text-sm text-slate-500">Batch #{{ b.id }}</p>
                <ul class="text-xs text-slate-500 mt-1 list-disc pl-4">
                  <li *ngFor="let u of b.items">{{ u.serial_number }}</li>
                </ul>
              </div>
              <div class="text-right">
                <span class="client-badge" [ngClass]="statusClass(b.status)">{{ statusLabel(b.status) }}</span>
                <p class="text-xs text-slate-500 mt-2">Preferred: {{ b.preferred_date || '—' }}</p>
                <p class="text-xs text-slate-500">Confirmed: {{ b.confirmed_date || '—' }}</p>
              </div>
            </div>
            <button *ngIf="b.status === 'awaiting_client'" type="button" (click)="confirmBatchDone(b.id)"
              class="client-btn-primary text-xs px-3 py-1.5 mt-2">Confirm done</button>
          </div>
        </div>

        <div *ngIf="!loading && typeFilter === 'mandatory' && mandatory.length" class="client-table-wrap">
          <table class="client-table">
            <thead>
              <tr><th>Inspection</th><th>Status</th><th>Due</th><th>Deadline</th><th>Inspector</th><th></th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let m of mandatory">
                <td class="font-semibold">{{ m.mandatory_name }}</td>
                <td><span class="client-badge" [ngClass]="statusClass(m.status)">{{ statusLabel(m.status) }}</span></td>
                <td>{{ m.due_date || '—' }}</td>
                <td>{{ m.deadline_date || '—' }}</td>
                <td>{{ m.inspector_name || '—' }}</td>
                <td class="text-right">
                  <button *ngIf="m.status === 'awaiting_client'" type="button"
                    (click)="confirmMandatoryDone(m.mandatory_instance_id)"
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

      <div *ngIf="showModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-[#0B1437]/50" (click)="closeModal()"></div>
        <div class="relative client-card w-full max-w-lg p-8 shadow-xl max-h-[90vh] overflow-y-auto">
          <h2 class="text-2xl font-bold text-[#0B1437] mb-1">New service request</h2>
          <p class="text-base text-slate-500 mb-4">Select one or more units for the same service type.</p>
          <p *ngIf="submitError" class="text-sm text-red-600 mb-4">{{ submitError }}</p>
          <form class="space-y-5" (ngSubmit)="submitRequest()">
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
              <div class="flex justify-between items-center mb-2">
                <label class="client-label mb-0">Units *</label>
                <button type="button" (click)="toggleAllUnits()" class="text-xs text-blue-600 font-semibold">
                  {{ allSelected ? 'Deselect all' : 'Select all' }}
                </button>
              </div>
              <div *ngIf="unitsLoading" class="text-sm text-slate-400 py-4">Loading your units…</div>
              <div *ngIf="!unitsLoading" class="max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-3 space-y-2">
                <label *ngFor="let u of units" class="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" [checked]="selectedSerials.has(u.serial_number)"
                    (change)="toggleUnit(u.serial_number)" class="rounded" />
                  <span>{{ u.serial_number }} · {{ u.type }} {{ u.capacity }}</span>
                </label>
                <p *ngIf="units.length === 0" class="text-sm text-slate-500">No units on your account.</p>
              </div>
              <p class="text-xs text-slate-500 mt-1">{{ selectedSerials.size }} selected</p>
            </div>
            <div>
              <label class="client-label">Preferred date</label>
              <input type="date" [(ngModel)]="form.preferred_date" name="preferredDate" class="client-input" />
            </div>
            <div>
              <label class="client-label">Notes</label>
              <textarea [(ngModel)]="form.client_notes" name="notes" rows="3" class="client-input resize-none"></textarea>
            </div>
            <div class="flex gap-3 pt-2">
              <button type="button" (click)="closeModal()" class="client-btn-secondary flex-1">Cancel</button>
              <button type="submit" [disabled]="submitting || selectedSerials.size === 0" class="client-btn-primary flex-1 disabled:opacity-40">Submit</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class ServiceRequestsComponent implements OnInit, AfterViewInit {
  private svc = inject(ServiceRequestService);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  loading = true;
  batches: any[] = [];
  mandatory: any[] = [];
  page = 1;
  lastPage = 1;
  total = 0;
  typeFilter: TypeFilter = 'all';
  showModal = false;
  submitting = false;
  submitError = '';
  units: any[] = [];
  unitsLoading = false;
  selectedSerials = new Set<string>();

  typeFilters = [
    { value: 'all' as TypeFilter, label: 'All' },
    { value: 'inspection' as TypeFilter, label: 'Inspection' },
    { value: 'refill' as TypeFilter, label: 'Refill' },
    { value: 'maintenance' as TypeFilter, label: 'Maintenance' },
    { value: 'mandatory' as TypeFilter, label: 'Mandatory' },
  ];

  form = { service_type: '', preferred_date: '', client_notes: '' };

  get isEmpty() {
    return this.typeFilter === 'mandatory' ? this.mandatory.length === 0 : this.batches.length === 0;
  }

  get allSelected() {
    return this.units.length > 0 && this.selectedSerials.size === this.units.length;
  }

  ngOnInit() { this.load(1); }

  load(page: number) {
    this.loading = true;
    this.page = page;
    this.svc.getMyRequests(page, 5, this.typeFilter === 'all' ? undefined : this.typeFilter).subscribe({
      next: (res) => {
        if (this.typeFilter === 'mandatory') {
          this.mandatory = res.data ?? [];
          this.batches = [];
        } else {
          this.batches = res.data ?? [];
          this.mandatory = [];
        }
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

  openModal() {
    this.showModal = true;
    this.loadUnits();
    setTimeout(() => this.refreshIcons(), 50);
  }

  loadUnits() {
    this.unitsLoading = true;
    this.http.get<any>('http://localhost:8000/api/extinguishers?page=1&limit=500', { withCredentials: true }).subscribe({
      next: (res) => {
        this.units = res.data ?? [];
        this.unitsLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.unitsLoading = false; this.cdr.detectChanges(); }
    });
  }

  toggleUnit(serial: string) {
    if (this.selectedSerials.has(serial)) this.selectedSerials.delete(serial);
    else this.selectedSerials.add(serial);
    this.cdr.detectChanges();
  }

  toggleAllUnits() {
    if (this.allSelected) this.selectedSerials.clear();
    else this.units.forEach(u => this.selectedSerials.add(u.serial_number));
    this.cdr.detectChanges();
  }

  closeModal() {
    this.showModal = false;
    this.form = { service_type: '', preferred_date: '', client_notes: '' };
    this.selectedSerials.clear();
    this.submitError = '';
  }

  submitRequest() {
    if (!this.form.service_type || this.selectedSerials.size === 0) return;
    this.submitting = true;
    this.submitError = '';
    this.svc.createRequest({
      serial_numbers: [...this.selectedSerials],
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

  confirmBatchDone(id: number) {
    if (!confirm('Confirm this service was completed to your satisfaction?')) return;
    this.svc.confirmDone(id, 'batch').subscribe({ next: () => this.load(this.page) });
  }

  confirmMandatoryDone(instanceId: number) {
    if (!confirm('Confirm this mandatory inspection was completed?')) return;
    this.svc.confirmDone(instanceId, 'mandatory', instanceId).subscribe({ next: () => this.load(this.page) });
  }

  ngAfterViewInit() { this.refreshIcons(); }
  private refreshIcons() { lucide?.createIcons?.(); }
}
