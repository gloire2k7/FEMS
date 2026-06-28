import { AfterViewInit, Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InspectionService } from '../../services/inspection.service';
import { PaginationComponent } from '../../shared/pagination/pagination.component';

@Component({
  selector: 'app-inspector-inspections',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  template: `
    <div class="max-w-5xl relative">
      <h1 class="text-2xl font-bold text-[#0B1437] mb-2">Inspections</h1>
      <p class="text-slate-500 mb-6">Open inspection jobs not yet assigned. Take a batch and confirm the visit date.</p>

      <p *ngIf="message" class="mb-4 px-4 py-3 rounded-xl text-sm"
        [class.bg-emerald-50]="!messageError" [class.text-emerald-700]="!messageError"
        [class.bg-red-50]="messageError" [class.text-red-700]="messageError">{{ message }}</p>

      <div *ngIf="loading" class="text-center py-16 text-slate-400">Loading…</div>

      <section *ngIf="!loading" class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div *ngIf="items.length === 0" class="py-12 text-center text-slate-500">No open inspections right now.</div>
        <div *ngIf="items.length" class="divide-y divide-slate-100">
          <div *ngFor="let a of items" class="p-5 flex flex-wrap items-center justify-between gap-4">
            <div class="min-w-0 flex-1">
              <p class="font-semibold text-[#0B1437]">{{ a.company_name || 'Client' }}</p>
              <p class="text-sm text-slate-500">{{ a.unit_count }} unit(s) · Preferred: {{ a.preferred_date || '—' }}</p>
              <p class="text-xs text-slate-400 mt-1 truncate" [title]="a.serial_numbers">{{ a.serial_numbers }}</p>
              <p *ngIf="a.client_notes" class="text-sm text-slate-600 mt-1 italic">{{ a.client_notes }}</p>
            </div>
            <button type="button"
              (click)="openClaim(a); $event.stopPropagation()"
              [disabled]="claiming"
              class="relative z-10 px-4 py-2 rounded-lg bg-[#0B1437] text-white text-sm font-semibold hover:bg-black cursor-pointer disabled:opacity-40">
              Take inspection
            </button>
          </div>
        </div>
        <div class="px-5 pb-2" *ngIf="total > 0">
          <app-pagination [page]="page" [lastPage]="lastPage" [total]="total" (pageChange)="load($event)" />
        </div>
      </section>
    </div>

    <div *ngIf="claimTarget" class="fixed inset-0 z-[9999] flex items-center justify-center p-4" role="dialog">
      <div class="absolute inset-0 bg-[#0B1437]/50" (click)="closeClaim()"></div>
      <div class="relative z-10 bg-white rounded-2xl w-full max-w-md p-6 shadow-xl" (click)="$event.stopPropagation()">
        <h2 class="text-lg font-bold text-[#0B1437] mb-1">Confirm visit date</h2>
        <p class="text-sm text-slate-500 mb-2">{{ claimTarget.company_name }} · {{ claimTarget.unit_count }} unit(s)</p>
        <p *ngIf="claimTarget.preferred_date" class="text-sm text-slate-600 mb-3">
          Client preferred: <strong>{{ claimTarget.preferred_date }}</strong>
        </p>
        <ul *ngIf="claimTarget.items?.length" class="text-xs text-slate-500 mb-3 max-h-24 overflow-y-auto list-disc pl-4">
          <li *ngFor="let u of claimTarget.items">{{ u.serial_number }}</li>
        </ul>
        <label class="block text-sm font-medium text-slate-600 mb-1">Confirmed date *</label>
        <input type="date" [(ngModel)]="claimDate" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-5" />
        <div class="flex gap-3">
          <button type="button" (click)="closeClaim()" class="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold">Cancel</button>
          <button type="button" (click)="confirmClaim()" [disabled]="!claimDate || claiming"
            class="flex-1 px-4 py-2 rounded-lg bg-[#0B1437] text-white text-sm font-semibold disabled:opacity-40">
            Confirm & take
          </button>
        </div>
      </div>
    </div>
  `
})
export class InspectorInspectionsComponent implements OnInit, AfterViewInit {
  private inspectionService = inject(InspectionService);
  private cdr = inject(ChangeDetectorRef);

  loading = true;
  items: any[] = [];
  page = 1;
  lastPage = 1;
  total = 0;
  claiming = false;
  claimTarget: any = null;
  claimDate = '';
  message = '';
  messageError = false;

  ngOnInit() { this.load(1); }

  load(page: number) {
    this.loading = true;
    this.page = page;
    this.inspectionService.getPool(page, 10).subscribe({
      next: (res) => {
        this.items = res.data ?? [];
        this.total = res.total ?? 0;
        this.lastPage = res.last_page ?? 1;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  openClaim(a: any) {
    this.claimTarget = a;
    this.claimDate = (a.preferred_date || '').slice(0, 10);
    this.message = '';
    this.cdr.detectChanges();
  }

  closeClaim() {
    if (this.claiming) return;
    this.claimTarget = null;
    this.claimDate = '';
    this.cdr.detectChanges();
  }

  confirmClaim() {
    if (!this.claimTarget || !this.claimDate) return;
    const assignmentId = this.claimTarget.id;
    const batchId = this.claimTarget.batch_id ? +this.claimTarget.batch_id : null;
    this.claiming = true;
    this.message = '';
    this.inspectionService.claim(assignmentId, this.claimDate, batchId).subscribe({
      next: (res) => {
        this.message = res.message || 'Inspection assigned to you.';
        this.messageError = false;
        this.claiming = false;
        this.claimTarget = null;
        this.claimDate = '';
        this.load(this.page);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.message = err.error?.message || 'Could not take this inspection.';
        this.messageError = true;
        this.claiming = false;
        this.cdr.detectChanges();
      }
    });
  }

  ngAfterViewInit() {}
}
