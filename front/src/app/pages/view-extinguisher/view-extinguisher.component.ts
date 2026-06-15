import { AfterViewInit, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ExtinguisherService } from '../../services/extinguisher.service';

declare const lucide: { createIcons: () => void } | undefined;

@Component({
  selector: 'app-view-extinguisher',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="client-page">
      <div *ngIf="loading" class="text-center py-20 text-base text-slate-400">Loading unit details…</div>

      <div *ngIf="!loading && error" class="client-card client-empty">
        <p class="text-lg font-semibold text-[#0B1437]">Unit not found</p>
        <p class="text-base text-slate-500 mt-2">{{ error }}</p>
        <a routerLink="/extinguishers" class="client-btn-primary mt-6 inline-flex">Back to my extinguishers</a>
      </div>

      <ng-container *ngIf="!loading && unit">
        <section class="client-hero">
          <div class="client-hero-inner flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <nav class="flex items-center gap-2 text-sm font-medium text-white/60 mb-3">
                <a routerLink="/extinguishers" class="hover:text-white transition-colors">My extinguishers</a>
                <span>/</span>
                <span class="text-white/90">{{ unit.serial_number }}</span>
              </nav>
              <h1 class="client-hero-title">{{ unit.type }} Extinguisher</h1>
              <p class="client-hero-sub">{{ unit.capacity }} · Serial {{ unit.serial_number }}</p>
            </div>
            <a routerLink="/service-requests" class="client-hero-btn shrink-0">
              <i data-lucide="wrench" class="w-5 h-5"></i>
              Request service
            </a>
          </div>
        </section>

        <section class="client-stat-grid">
          <div class="client-stat client-stat--primary">
            <div class="relative z-10">
              <p class="client-stat-label">Type</p>
              <p class="client-stat-value text-xl">{{ unit.type }}</p>
            </div>
          </div>
          <div class="client-stat client-stat--featured">
            <div class="relative z-10">
              <p class="client-stat-label">Status</p>
              <p class="client-stat-value text-xl">{{ statusLabel }}</p>
              <p class="client-stat-hint">{{ statusHint }}</p>
            </div>
          </div>
          <div class="client-stat client-stat--warning" *ngIf="unit.expiry_date">
            <div class="relative z-10">
              <p class="client-stat-label">Expiry</p>
              <p class="client-stat-value text-xl">{{ unit.expiry_date | date:'mediumDate' }}</p>
            </div>
          </div>
        </section>

        <section class="client-card p-6">
          <h2 class="text-lg font-semibold text-[#0B1437] mb-5">Unit details</h2>
          <dl class="grid sm:grid-cols-2 gap-5 text-base">
            <div>
              <dt class="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1">Serial number</dt>
              <dd class="font-medium text-[#0B1437]">{{ unit.serial_number || '—' }}</dd>
            </div>
            <div>
              <dt class="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1">Capacity</dt>
              <dd class="font-medium text-[#0B1437]">{{ unit.capacity || '—' }}</dd>
            </div>
            <div>
              <dt class="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1">Manufacturing date</dt>
              <dd class="font-medium text-[#0B1437]">{{ unit.manufacturing_date ? (unit.manufacturing_date | date:'mediumDate') : '—' }}</dd>
            </div>
            <div>
              <dt class="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1">Last filled</dt>
              <dd class="font-medium text-[#0B1437]">{{ unit.filling_date ? (unit.filling_date | date:'mediumDate') : '—' }}</dd>
            </div>
          </dl>
        </section>

        <section class="client-card p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 class="text-lg font-semibold text-[#0B1437]">Need maintenance or inspection?</h2>
            <p class="text-base text-slate-500 mt-1">Submit a service request and our team will follow up.</p>
          </div>
          <a routerLink="/service-requests" class="client-btn-primary shrink-0 inline-flex">Request service</a>
        </section>
      </ng-container>
    </div>
  `
})
export class ViewExtinguisherComponent implements OnInit, AfterViewInit {
  private route = inject(ActivatedRoute);
  private extService = inject(ExtinguisherService);

  loading = true;
  error = '';
  unit: any = null;

  get statusLabel(): string {
    if (!this.unit) return '—';
    if (this.unit.expiry_date && new Date(this.unit.expiry_date) < new Date()) return 'Expired';
    const s = (this.unit.status || '').toLowerCase();
    if (s === 'maintenance' || s === 'under_maintenance') return 'In service';
    if (s === 'filled' || s === 'active') return 'Valid';
    return this.unit.status || 'Active';
  }

  get statusHint(): string {
    if (this.statusLabel === 'Expired') return 'Schedule replacement or refill';
    if (this.statusLabel === 'In service') return 'Currently being serviced';
    return 'In good standing';
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'No extinguisher specified.';
      this.loading = false;
      return;
    }
    this.extService.getExtinguisher(id).subscribe({
      next: (data) => {
        this.unit = data;
        this.loading = false;
        setTimeout(() => lucide?.createIcons?.(), 50);
      },
      error: () => {
        this.error = 'Could not load this extinguisher.';
        this.loading = false;
      }
    });
  }

  ngAfterViewInit() {
    setTimeout(() => lucide?.createIcons?.(), 50);
  }
}
