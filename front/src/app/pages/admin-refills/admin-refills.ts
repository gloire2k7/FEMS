import { Component, AfterViewInit, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiceRequestService } from '../../services/service-request.service';
import { PaginationComponent } from '../../shared/pagination/pagination.component';

declare const lucide: { createIcons: () => void } | undefined;

@Component({
  selector: 'app-admin-refills',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './admin-refills.html',
  styleUrls: ['./admin-refills.css'],
})
export class AdminRefills implements OnInit, AfterViewInit {
  private svc = inject(ServiceRequestService);
  private cdr = inject(ChangeDetectorRef);

  loading = true;
  requests: any[] = [];
  page = 1;
  lastPage = 1;
  total = 0;
  statusFilter = 'all';
  searchTerm = '';
  showFeeForm = false;
  refillFee = 0;
  maintenanceFee = 0;
  feeMessage = '';
  actionMessage = '';

  scheduleDates: Record<number, string> = {};
  scheduleFees: Record<number, number> = {};

  get filteredRequests() {
    const q = this.searchTerm.trim().toLowerCase();
    if (!q) return this.requests;
    return this.requests.filter(r =>
      (r.company_name || '').toLowerCase().includes(q) ||
      (r.items || []).some((u: any) => (u.serial_number || '').toLowerCase().includes(q))
    );
  }

  get pendingCount() { return this.requests.filter(r => r.status === 'pending').length; }
  get scheduledCount() { return this.requests.filter(r => r.status === 'scheduled').length; }
  get awaitingCount() { return this.requests.filter(r => r.status === 'awaiting_client').length; }

  ngOnInit() { this.load(1); }

  load(page: number) {
    this.loading = true;
    this.page = page;
    const status = this.statusFilter === 'all' ? undefined : this.statusFilter;
    this.svc.getRefills(page, status).subscribe({
      next: (res) => {
        this.requests = res.data ?? [];
        this.total = res.total ?? 0;
        this.lastPage = res.last_page ?? 1;
        const fees = res.fees ?? [];
        for (const f of fees) {
          if (f.service_type === 'refill') this.refillFee = +f.fee_per_unit;
          if (f.service_type === 'maintenance') this.maintenanceFee = +f.fee_per_unit;
        }
        for (const r of this.requests) {
          if (!this.scheduleDates[r.id]) {
            this.scheduleDates[r.id] = r.preferred_date || '';
            this.scheduleFees[r.id] = r.fee ?? (r.service_type === 'refill' ? this.refillFee : this.maintenanceFee);
          }
        }
        this.loading = false;
        this.cdr.detectChanges();
        this.refreshIcons();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  setStatusFilter(f: string) {
    this.statusFilter = f;
    this.load(1);
  }

  saveFees() {
    this.svc.updateFees(this.refillFee, this.maintenanceFee).subscribe({
      next: (res) => {
        this.feeMessage = res.message || 'Fees saved.';
        this.showFeeForm = false;
        this.cdr.detectChanges();
      }
    });
  }

  confirmSchedule(r: any) {
    const date = this.scheduleDates[r.id];
    if (!date) { this.actionMessage = 'Please set a confirmed date.'; return; }
    this.svc.schedule(r.id, date, this.scheduleFees[r.id]).subscribe({
      next: (res) => { this.actionMessage = res.message; this.load(this.page); },
      error: (err) => { this.actionMessage = err.error?.message || 'Failed.'; this.cdr.detectChanges(); }
    });
  }

  markDone(r: any) {
    this.svc.markDone(r.id).subscribe({
      next: (res) => { this.actionMessage = res.message; this.load(this.page); },
      error: (err) => { this.actionMessage = err.error?.message || 'Failed.'; this.cdr.detectChanges(); }
    });
  }

  statusClass(status: string): string {
    return ({
      pending: 'bg-amber-50 text-amber-700 ring-amber-200/60',
      scheduled: 'bg-blue-50 text-blue-700 ring-blue-200/60',
      awaiting_client: 'bg-purple-50 text-purple-700 ring-purple-200/60',
      completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200/60',
    } as any)[status] || 'bg-slate-50 text-slate-600';
  }

  ngAfterViewInit() { this.refreshIcons(); }
  private refreshIcons() { setTimeout(() => lucide?.createIcons?.(), 50); }
}
