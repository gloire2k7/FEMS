import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MandatoryInspectionService } from '../../services/mandatory-inspection.service';
import { PaginationComponent } from '../../shared/pagination/pagination.component';

@Component({
  selector: 'app-inspector-mandatory-inspections',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  template: `
    <div class="max-w-5xl">
      <h1 class="text-2xl font-bold text-[#0B1437] mb-2">Mandatory inspections</h1>
      <p class="text-slate-500 mb-6">Regular inspections you are responsible for. Submit results when done.</p>

      <p *ngIf="message" class="mb-4 px-4 py-3 rounded-xl text-sm"
        [class.bg-emerald-50]="!messageError" [class.text-emerald-700]="!messageError"
        [class.bg-red-50]="messageError" [class.text-red-700]="messageError">{{ message }}</p>

      <div *ngIf="loading" class="text-center py-16 text-slate-400">Loading…</div>

      <section *ngIf="!loading" class="space-y-4">
        <div *ngIf="items.length === 0" class="bg-white rounded-2xl border border-slate-200 py-12 text-center text-slate-500">
          No mandatory inspections assigned.
        </div>

        <article *ngFor="let m of items" class="bg-white rounded-2xl border border-slate-200 p-6">
          <div class="flex flex-wrap justify-between gap-3 mb-3">
            <div>
              <p class="font-bold text-[#0B1437]">{{ m.mandatory_name }}</p>
              <p class="text-sm text-slate-500">{{ m.company_name }}</p>
              <p class="text-sm text-slate-500">Due: {{ m.due_date }} · Deadline: {{ m.deadline_date }}</p>
            </div>
            <span class="px-3 py-1 rounded-full text-xs font-semibold"
              [class.bg-amber-50]="m.status === 'scheduled'" [class.text-amber-700]="m.status === 'scheduled'"
              [class.bg-purple-50]="m.status === 'awaiting_client'" [class.text-purple-700]="m.status === 'awaiting_client'">
              {{ m.status === 'awaiting_client' ? 'Awaiting client' : m.status }}
            </span>
          </div>

          <div *ngIf="m.status === 'scheduled' && completingId !== m.id" class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-slate-600 mb-1">Result</label>
              <select [(ngModel)]="forms[m.id].result_status" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                <option value="passed">Passed</option>
                <option value="requires_refill">Requires refill</option>
                <option value="expired">Expired</option>
                <option value="condemned">Condemned</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-600 mb-1">Notes</label>
              <textarea [(ngModel)]="forms[m.id].notes" rows="3" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"></textarea>
            </div>
            <button type="button" (click)="submit(m.id)" class="px-5 py-2 rounded-lg bg-[#0B1437] text-white text-sm font-semibold">
              Submit inspection
            </button>
          </div>
        </article>

        <app-pagination *ngIf="total > 0" [page]="page" [lastPage]="lastPage" [total]="total" (pageChange)="load($event)" />
      </section>
    </div>
  `
})
export class InspectorMandatoryInspectionsComponent implements OnInit {
  private svc = inject(MandatoryInspectionService);
  private cdr = inject(ChangeDetectorRef);

  loading = true;
  items: any[] = [];
  forms: Record<number, { result_status: string; notes: string }> = {};
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
    this.svc.getMine(page, 10).subscribe({
      next: (res) => {
        this.items = res.data ?? [];
        this.total = res.total ?? 0;
        this.lastPage = res.last_page ?? 1;
        for (const m of this.items) {
          if (!this.forms[m.id]) {
            this.forms[m.id] = { result_status: 'passed', notes: '' };
          }
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  submit(id: number) {
    this.completingId = id;
    this.svc.complete(id, this.forms[id]).subscribe({
      next: (res) => {
        this.message = res.message;
        this.messageError = false;
        this.completingId = null;
        this.load(this.page);
      },
      error: (err) => {
        this.message = err.error?.message || 'Failed.';
        this.messageError = true;
        this.completingId = null;
        this.cdr.detectChanges();
      }
    });
  }
}
