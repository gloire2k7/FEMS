import { AfterViewInit, Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { InspectionService } from '../../services/inspection.service';
import { PaginationComponent } from '../../shared/pagination/pagination.component';

declare const lucide: { createIcons: () => void } | undefined;

@Component({
  selector: 'app-inspector-my-inspections',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PaginationComponent],
  template: `
    <div class="max-w-5xl">
      <h1 class="text-2xl font-bold text-[#0B1437] mb-2">My inspections</h1>
      <p class="text-slate-500 mb-6">Inspections assigned to you. Add notes and results when done. The client must confirm before the request is fully closed.</p>

      <p *ngIf="message" class="mb-4 px-4 py-3 rounded-xl text-sm"
        [class.bg-emerald-50]="!messageError" [class.text-emerald-700]="!messageError"
        [class.bg-red-50]="messageError" [class.text-red-700]="messageError">{{ message }}</p>

      <div *ngIf="loading" class="text-center py-16 text-slate-400">Loading…</div>

      <section *ngIf="!loading" class="space-y-4">
        <div *ngIf="items.length === 0" class="bg-white rounded-2xl border border-slate-200 py-12 text-center text-slate-500">
          No inspections assigned yet. Browse <a routerLink="/inspector-inspections" class="text-blue-600 hover:underline">open inspections</a>.
        </div>

        <article *ngFor="let a of items" class="bg-white rounded-2xl border border-slate-200 p-6">
          <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
            <div>
              <p class="font-bold text-[#0B1437]">{{ a.serial_number }}</p>
              <p class="text-sm text-slate-500">{{ a.type }} · {{ a.capacity }} · {{ a.location_name || 'No location' }}</p>
              <p class="text-sm text-slate-500">{{ a.company_name || '—' }}</p>
              <p *ngIf="a.due_date" class="text-sm text-slate-500">Scheduled: {{ a.due_date }}</p>
            </div>
            <span class="shrink-0 px-3 py-1 rounded-full text-xs font-semibold"
              [class.bg-amber-50]="a.status === 'assigned'" [class.text-amber-700]="a.status === 'assigned'"
              [class.bg-purple-50]="a.status === 'completed'" [class.text-purple-700]="a.status === 'completed'">
              {{ a.status === 'completed' ? 'Awaiting client' : 'In progress' }}
            </span>
          </div>

          <div *ngIf="a.status === 'completed'" class="text-sm text-slate-600 space-y-1">
            <p class="text-purple-700 font-medium">Submitted — waiting for client to confirm on their portal.</p>
            <p><strong>Result:</strong> {{ a.result_status }}</p>
            <p><strong>Date:</strong> {{ a.inspection_date }}</p>
            <p *ngIf="a.notes"><strong>Notes:</strong> {{ a.notes }}</p>
          </div>

          <div *ngIf="a.status === 'assigned' && completingId !== a.id" class="space-y-3">
            <div class="grid sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-slate-600 mb-1">Result</label>
                <select [(ngModel)]="forms[a.id].result_status" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                  <option value="passed">Passed</option>
                  <option value="requires_refill">Requires refill</option>
                  <option value="expired">Expired</option>
                  <option value="condemned">Condemned</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-600 mb-1">Inspection date</label>
                <input type="date" [(ngModel)]="forms[a.id].inspection_date" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-600 mb-1">Notes</label>
              <textarea [(ngModel)]="forms[a.id].notes" rows="3" placeholder="Observations after inspection…"
                class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"></textarea>
            </div>
            <button type="button" (click)="submitComplete(a.id)" [disabled]="completingId === a.id"
              class="px-5 py-2 rounded-lg bg-[#0B1437] text-white text-sm font-semibold disabled:opacity-40">
              Mark complete
            </button>
          </div>
        </article>

        <div *ngIf="total > 0">
          <app-pagination [page]="page" [lastPage]="lastPage" [total]="total" (pageChange)="load($event)" />
        </div>
      </section>
    </div>
  `
})
export class InspectorMyInspectionsComponent implements OnInit, AfterViewInit {
  private inspectionService = inject(InspectionService);
  private cdr = inject(ChangeDetectorRef);

  loading = true;
  items: any[] = [];
  forms: Record<number, { result_status: string; notes: string; inspection_date: string }> = {};
  page = 1;
  lastPage = 1;
  total = 0;
  completingId: number | null = null;
  message = '';
  messageError = false;

  ngOnInit() { this.load(1); }

  load(page: number) {
    this.loading = true;
    this.page = page;
    this.inspectionService.getMine(page, 10).subscribe({
      next: (res) => {
        this.items = res.data ?? [];
        this.total = res.total ?? 0;
        this.lastPage = res.last_page ?? 1;
        for (const a of this.items) {
          if (!this.forms[a.id]) {
            this.forms[a.id] = {
              result_status: 'passed',
              notes: '',
              inspection_date: new Date().toISOString().slice(0, 10)
            };
          }
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  submitComplete(id: number) {
    const form = this.forms[id];
    this.completingId = id;
    this.message = '';
    this.inspectionService.complete(id, form).subscribe({
      next: (res) => {
        this.message = res.message || 'Inspection submitted. Awaiting client confirmation.';
        this.messageError = false;
        this.completingId = null;
        this.load(this.page);
      },
      error: (err) => {
        this.message = err.error?.message || 'Could not complete inspection.';
        this.messageError = true;
        this.completingId = null;
        this.cdr.detectChanges();
      }
    });
  }

  ngAfterViewInit() { setTimeout(() => lucide?.createIcons?.(), 50); }
}
