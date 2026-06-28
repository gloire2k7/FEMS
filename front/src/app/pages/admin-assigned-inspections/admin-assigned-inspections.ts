import { Component, AfterViewInit, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiceRequestService } from '../../services/service-request.service';
import { AuthService } from '../../auth.service';
import { PaginationComponent } from '../../shared/pagination/pagination.component';

declare const lucide: { createIcons: () => void } | undefined;

type Tab = 'pending' | 'assigned';

@Component({
  selector: 'app-admin-assigned-inspections',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  template: `
    <div class="client-page max-w-5xl">
      <h1 class="text-2xl font-bold text-[#0B1437] mb-2">Inspection requests</h1>
      <p class="text-slate-500 mb-6">Assign pending client inspection batches or track scheduled ones.</p>

      <section class="client-card p-4 mb-5 flex gap-2">
        <button type="button" (click)="setTab('pending')"
          class="px-4 py-2 rounded-lg text-sm font-semibold"
          [class.bg-[#0B1437]]="tab === 'pending'" [class.text-white]="tab === 'pending'"
          [class.bg-slate-100]="tab !== 'pending'">Pending</button>
        <button type="button" (click)="setTab('assigned')"
          class="px-4 py-2 rounded-lg text-sm font-semibold"
          [class.bg-[#0B1437]]="tab === 'assigned'" [class.text-white]="tab === 'assigned'"
          [class.bg-slate-100]="tab !== 'assigned'">Assigned</button>
      </section>

      <p *ngIf="message" class="mb-4 px-4 py-3 rounded-xl text-sm"
        [class.bg-emerald-50]="!messageError" [class.text-emerald-700]="!messageError"
        [class.bg-red-50]="messageError" [class.text-red-700]="messageError">{{ message }}</p>

      <div *ngIf="loading" class="text-center py-16 text-slate-400">Loading…</div>

      <section *ngIf="!loading" class="client-card overflow-hidden">
        <div *ngIf="items.length === 0" class="client-empty py-12">
          {{ tab === 'pending' ? 'No pending inspection requests.' : 'No assigned inspections.' }}
        </div>
        <div *ngIf="items.length" class="divide-y divide-slate-100">
          <div *ngFor="let r of items" class="p-6">
            <div class="flex flex-wrap justify-between gap-3 mb-3">
              <div>
                <p class="font-bold text-[#0B1437]">{{ r.company_name }} · {{ r.unit_count }} unit(s)</p>
                <p class="text-sm text-slate-500 capitalize">{{ r.service_type }} batch #{{ r.id }}</p>
                <p *ngIf="r.client_notes" class="text-sm text-slate-600 mt-1">{{ r.client_notes }}</p>
                <ul class="text-xs text-slate-500 mt-2 list-disc pl-4">
                  <li *ngFor="let u of r.items">{{ u.serial_number }} · {{ u.type }} {{ u.capacity }}</li>
                </ul>
              </div>
              <div class="text-right text-sm text-slate-500">
                <p>Preferred: {{ r.preferred_date || '—' }}</p>
                <p *ngIf="tab === 'assigned'">Confirmed: {{ r.confirmed_date || '—' }}</p>
                <p *ngIf="tab === 'assigned'">Inspector: {{ r.inspector_name || '—' }}</p>
                <span class="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100">{{ r.status }}</span>
              </div>
            </div>
            <div *ngIf="tab === 'pending'" class="grid sm:grid-cols-3 gap-3 items-end">
              <div>
                <label class="block text-xs text-slate-500 mb-1">Inspector</label>
                <select [(ngModel)]="assignForm[r.id].inspector_id" class="client-input text-sm w-full">
                  <option [ngValue]="null">Select inspector…</option>
                  <option *ngFor="let i of inspectors" [ngValue]="+i.id">{{ i.name }}</option>
                </select>
              </div>
              <div>
                <label class="block text-xs text-slate-500 mb-1">Confirmed date</label>
                <input type="date" [(ngModel)]="assignForm[r.id].confirmed_date" class="client-input text-sm w-full" />
              </div>
              <button type="button" (click)="assign(r.id)" [disabled]="!assignForm[r.id]?.inspector_id || !assignForm[r.id]?.confirmed_date"
                class="client-btn-primary text-sm disabled:opacity-40">Assign batch</button>
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

  tab: Tab = 'pending';
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

  setTab(t: Tab) {
    this.tab = t;
    this.load(1);
  }

  load(page: number) {
    this.loading = true;
    this.page = page;
    const req = this.tab === 'pending'
      ? this.svc.getPendingInspections(page)
      : this.svc.getAssignedInspections(page);
    req.subscribe({
      next: (res) => {
        this.items = res.data ?? [];
        this.total = res.total ?? 0;
        this.lastPage = res.last_page ?? 1;
        for (const r of this.items) {
          if (!this.assignForm[r.id]) {
            this.assignForm[r.id] = { inspector_id: null, confirmed_date: (r.preferred_date || '').slice(0, 10) };
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
