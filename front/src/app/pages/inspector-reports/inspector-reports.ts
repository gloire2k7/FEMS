import { AfterViewInit, Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

declare const lucide: { createIcons: () => void } | undefined;

const API = 'http://localhost:8000';

@Component({
  selector: 'app-inspector-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-5xl">
      <h1 class="text-2xl font-bold text-[#0B1437] mb-2">Reports</h1>
      <p class="text-slate-500 mb-6">Generate a report of inspections you have completed.</p>

      <section class="bg-white rounded-2xl border border-slate-200 p-6 mb-8">
        <h2 class="text-lg font-semibold text-[#0B1437] mb-4">Generate report</h2>
        <p *ngIf="genMessage" class="mb-4 text-sm px-3 py-2 rounded-lg"
          [class.bg-emerald-50]="!genError" [class.text-emerald-700]="!genError"
          [class.bg-red-50]="genError" [class.text-red-700]="genError">{{ genMessage }}</p>
        <div class="flex flex-wrap gap-4 items-end">
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-1">Format</label>
            <select [(ngModel)]="format" class="px-3 py-2 border border-slate-200 rounded-lg text-sm">
              <option value="pdf">PDF</option>
              <option value="csv">CSV</option>
            </select>
          </div>
          <button type="button" (click)="generate()" [disabled]="generating"
            class="px-5 py-2 rounded-lg bg-[#0B1437] text-white text-sm font-semibold disabled:opacity-40">
            Generate my inspections report
          </button>
        </div>
      </section>

      <section class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <h2 class="text-lg font-semibold text-[#0B1437] p-6 pb-0">Download history</h2>
        <div *ngIf="loading" class="py-12 text-center text-slate-400">Loading…</div>
        <div *ngIf="!loading && reports.length === 0" class="py-12 text-center text-slate-500">No reports yet.</div>
        <table *ngIf="!loading && reports.length" class="w-full text-sm mt-4">
          <thead class="bg-slate-50 text-left text-slate-500 uppercase text-xs">
            <tr>
              <th class="px-5 py-3">Name</th>
              <th class="px-5 py-3">Format</th>
              <th class="px-5 py-3">Date</th>
              <th class="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of reports" class="border-t border-slate-100">
              <td class="px-5 py-4 font-medium text-[#0B1437]">{{ r.name }}</td>
              <td class="px-5 py-4 uppercase">{{ r.format }}</td>
              <td class="px-5 py-4 text-slate-600">{{ r.created_at | date:'medium' }}</td>
              <td class="px-5 py-4 text-right">
                <a [href]="API + r.file_path" target="_blank"
                  class="text-sm font-medium text-blue-600 hover:underline">Download</a>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  `
})
export class InspectorReportsComponent implements OnInit, AfterViewInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  readonly API = API;
  loading = true;
  generating = false;
  reports: any[] = [];
  format = 'pdf';
  genMessage = '';
  genError = false;

  ngOnInit() { this.loadReports(); }

  loadReports() {
    this.loading = true;
    this.http.get<any>(`${API}/api/reports`, { withCredentials: true }).subscribe({
      next: (res) => {
        this.reports = res.reports ?? [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  generate() {
    this.generating = true;
    this.genMessage = '';
    const body = new FormData();
    body.append('type', 'my_inspections');
    body.append('format', this.format);
    this.http.post(`${API}/api/reports`, body, { withCredentials: true }).subscribe({
      next: (res: any) => {
        this.genMessage = res.message || 'Report generated.';
        this.genError = false;
        this.generating = false;
        this.loadReports();
      },
      error: (err) => {
        this.genMessage = err.error?.message || 'Failed to generate report.';
        this.genError = true;
        this.generating = false;
        this.cdr.detectChanges();
      }
    });
  }

  ngAfterViewInit() { setTimeout(() => lucide?.createIcons?.(), 50); }
}
