import { Component, AfterViewInit, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiceRequestService } from '../../services/service-request.service';
import { AuthService } from '../../auth.service';
import { PaginationComponent } from '../../shared/pagination/pagination.component';

declare const lucide: { createIcons: () => void } | undefined;

@Component({
  selector: 'app-admin-assigned-inspections',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  template: `
    <div class="client-page max-w-5xl">
      <h1 class="text-2xl font-bold text-[#0B1437] mb-2">Pending inspection requests</h1>
      <p class="text-slate-500 mb-6">Assign client inspection requests to active inspectors and confirm the date.</p>

      <p *ngIf="message" class="mb-4 px-4 py-3 rounded-xl text-sm"
        [class.bg-emerald-50]="!messageError" [class.text-emerald-700]="!messageError"
        [class.bg-red-50]="messageError" [class.text-red-700]="messageError">{{ message }}</p>

      <div *ngIf="loading" class="text-center py-16 text-slate-400">Loading…</div>

      <section *ngIf="!loading" class="client-card overflow-hidden">
        <div *ngIf="items.length === 0" class="client-empty py-12">No pending inspection requests.</div>
        <div *ngIf="items.length" class="divide-y divide-slate-100">
          <div *ngFor="let r of items" class="p-6">
            <div class="flex flex-wrap justify-between gap-3 mb-3">
              <div>
                <p class="font-bold text-[#0B1437]">{{ r.serial_number }}</p>
                <p class="text-sm text-slate-500">{{ r.company_name }} · {{ r.type }} {{ r.capacity }}</p>
                <p *ngIf="r.client_notes" class="text-sm text-slate-600 mt-1">{{ r.client_notes }}</p>
              </div>
              <p class="text-sm text-slate-500">Preferred: {{ r.preferred_date || '—' }}</p>
            </div>
            <div class="grid sm:grid-cols-3 gap-3 items-end">
              <div>
                <label class="block text-xs text-slate-500 mb-1">Inspector</label>
                <select [(ngModel)]="assignForm[r.id].inspector_id" class="client-input text-sm w-full">
                  <option [ngValue]="null">Select inspector…</option>
                  <option *ngFor="let i of inspectors" [ngValue]="i.id">{{ i.name }}</option>
                </select>
              </div>
              <div>
                <label class="block text-xs text-slate-500 mb-1">Confirmed date</label>
                <input type="date" [(ngModel)]="assignForm[r.id].confirmed_date" class="client-input text-sm w-full" />
              </div>
              <button type="button" (click)="assign(r.id)" [disabled]="!assignForm[r.id]?.inspector_id || !assignForm[r.id]?.confirmed_date"
                class="client-btn-primary text-sm disabled:opacity-40">Assign</button>
            </div>
          </div>
        </div>
        <div class="px-5 pb-2" *ngIf="total > 0">
          <app-pagination [page]="page" [lastPage]="lastPage" [total]="total" (pageChange)="load($event)" />
        </div>
      </section>
    </div>
  `
})
export class AdminAssignedInspections implements OnInit, AfterViewInit {
  private svc = inject(ServiceRequestService);
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  loading = true;
  items: any[] = [];
  inspectors: any[] = [];
  assignForm: Record<number, { inspector_id: number | null; confirmed_date: string }> = {};
  page = 1;
  lastPage = 1;
  total = 0;
  message = '';
  messageError = false;

  ngOnInit() {
    this.auth.getInspectors(1, 'active').subscribe({
      next: (res) => this.inspectors = res.data ?? []
    });
    this.load(1);
  }

  load(page: number) {
    this.loading = true;
    this.page = page;
    this.svc.getPendingInspections(page).subscribe({
      next: (res) => {
        this.items = res.data ?? [];
        this.total = res.total ?? 0;
        this.lastPage = res.last_page ?? 1;
        for (const r of this.items) {
          if (!this.assignForm[r.id]) {
            this.assignForm[r.id] = { inspector_id: null, confirmed_date: r.preferred_date || '' };
          }
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  assign(id: number) {
    const f = this.assignForm[id];
    if (!f?.inspector_id || !f.confirmed_date) return;
    this.svc.assignInspection(id, f.inspector_id, f.confirmed_date).subscribe({
      next: (res) => { this.message = res.message; this.messageError = false; this.load(this.page); },
      error: (err) => { this.message = err.error?.message || 'Failed.'; this.messageError = true; this.cdr.detectChanges(); }
    });
  }

  ngAfterViewInit() { setTimeout(() => lucide?.createIcons?.(), 50); }
}
