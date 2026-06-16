import { AfterViewInit, Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InspectionService } from '../../services/inspection.service';
import { PaginationComponent } from '../../shared/pagination/pagination.component';

declare const lucide: { createIcons: () => void } | undefined;

@Component({
  selector: 'app-inspector-inspections',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  template: `
    <div class="max-w-5xl">
      <h1 class="text-2xl font-bold text-[#0B1437] mb-2">Inspections</h1>
      <p class="text-slate-500 mb-6">Pending inspections not yet assigned. Take one and confirm the visit date.</p>

      <p *ngIf="message" class="mb-4 px-4 py-3 rounded-xl text-sm"
        [class.bg-emerald-50]="!messageError" [class.text-emerald-700]="!messageError"
        [class.bg-red-50]="messageError" [class.text-red-700]="messageError">{{ message }}</p>

      <div *ngIf="loading" class="text-center py-16 text-slate-400">Loading…</div>

      <section *ngIf="!loading" class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div *ngIf="items.length === 0" class="py-12 text-center text-slate-500">No open inspections right now.</div>
        <div *ngIf="items.length" class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-slate-50 text-left text-slate-500 uppercase text-xs">
              <tr>
                <th class="px-5 py-3">Serial</th>
                <th class="px-5 py-3">Unit</th>
                <th class="px-5 py-3">Location</th>
                <th class="px-5 py-3">Client</th>
                <th class="px-5 py-3">Preferred date</th>
                <th class="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let a of items" class="border-t border-slate-100">
                <td class="px-5 py-4 font-semibold text-[#0B1437]">{{ a.serial_number }}</td>
                <td class="px-5 py-4 text-slate-600">{{ a.type }} · {{ a.capacity }}</td>
                <td class="px-5 py-4 text-slate-600">{{ a.location_name || '—' }}</td>
                <td class="px-5 py-4 text-slate-600">{{ a.company_name || '—' }}</td>
                <td class="px-5 py-4 text-slate-600">{{ a.preferred_date || '—' }}</td>
                <td class="px-5 py-4 text-right">
                  <button type="button" (click)="openClaim(a)" [disabled]="claiming === a.id"
                    class="px-4 py-2 rounded-lg bg-[#0B1437] text-white text-sm font-semibold disabled:opacity-40">
                    Take inspection
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="px-5 pb-2" *ngIf="total > 0">
          <app-pagination [page]="page" [lastPage]="lastPage" [total]="total" (pageChange)="load($event)" />
        </div>
      </section>

      <div *ngIf="claimTarget" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-[#0B1437]/50 backdrop-blur-sm" (click)="closeClaim()"></div>
        <div class="relative bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
          <h2 class="text-lg font-bold text-[#0B1437] mb-1">Confirm visit date</h2>
          <p class="text-sm text-slate-500 mb-4">
            {{ claimTarget.serial_number }} · {{ claimTarget.company_name || 'Client' }}
          </p>
          <p *ngIf="claimTarget.preferred_date" class="text-sm text-slate-600 mb-3">
            Client preferred: <strong>{{ claimTarget.preferred_date }}</strong>
          </p>
          <p *ngIf="claimTarget.client_notes" class="text-sm text-slate-600 mb-3 italic">{{ claimTarget.client_notes }}</p>
          <label class="block text-sm font-medium text-slate-600 mb-1">Confirmed date *</label>
          <input type="date" [(ngModel)]="claimDate" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-5" />
          <div class="flex gap-3">
            <button type="button" (click)="closeClaim()" class="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600">Cancel</button>
            <button type="button" (click)="confirmClaim()" [disabled]="!claimDate || claiming !== null"
              class="flex-1 px-4 py-2 rounded-lg bg-[#0B1437] text-white text-sm font-semibold disabled:opacity-40">
              Confirm & take
            </button>
          </div>
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
  claiming: number | null = null;
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
    this.claimDate = a.preferred_date || a.due_date || '';
    this.message = '';
  }

  closeClaim() {
    if (this.claiming !== null) return;
    this.claimTarget = null;
    this.claimDate = '';
  }

  confirmClaim() {
    if (!this.claimTarget || !this.claimDate) return;
    const id = this.claimTarget.id;
    this.claiming = id;
    this.message = '';
    this.inspectionService.claim(id, this.claimDate).subscribe({
      next: (res) => {
        this.message = res.message || 'Inspection assigned to you.';
        this.messageError = false;
        this.claiming = null;
        this.claimTarget = null;
        this.claimDate = '';
        this.load(this.page);
      },
      error: (err) => {
        this.message = err.error?.message || 'Could not take this inspection.';
        this.messageError = true;
        this.claiming = null;
        this.cdr.detectChanges();
      }
    });
  }

  ngAfterViewInit() { setTimeout(() => lucide?.createIcons?.(), 50); }
}
