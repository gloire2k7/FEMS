import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

declare const lucide: { createIcons: () => void } | undefined;

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="client-page">
      <section class="client-hero">
        <div class="client-hero-inner">
          <p class="client-hero-eyebrow">Compliance</p>
          <h1 class="client-hero-title">Reports</h1>
          <p class="client-hero-sub">Inspection and compliance reports for your locations.</p>
        </div>
      </section>

      <section class="client-stat-grid">
        <button type="button" (click)="setReportFilter('all')"
          class="client-stat client-stat--primary client-stat-link"
          [class.client-stat-link--active]="reportQuickFilter === 'all'">
          <div class="relative z-10 flex items-start justify-between gap-3">
            <div>
              <p class="client-stat-label">Total reports</p>
              <p class="client-stat-value">{{ reports.length }}</p>
              <p class="client-stat-hint">Available to download</p>
            </div>
            <span class="client-stat-icon"><i data-lucide="file-text" class="w-5 h-5"></i></span>
          </div>
        </button>
        <button type="button" (click)="setReportFilter('compliance')"
          class="client-stat client-stat--featured client-stat-link"
          [class.client-stat-link--active]="reportQuickFilter === 'compliance'">
          <div class="relative z-10 flex items-start justify-between gap-3">
            <div>
              <p class="client-stat-label">Compliance</p>
              <p class="client-stat-value">{{ countByType('Compliance') }}</p>
              <p class="client-stat-hint">Summary reports</p>
            </div>
            <span class="client-stat-icon"><i data-lucide="sparkles" class="w-5 h-5"></i></span>
          </div>
        </button>
        <button type="button" (click)="setReportFilter('inspection')"
          class="client-stat client-stat--info client-stat-link"
          [class.client-stat-link--active]="reportQuickFilter === 'inspection'">
          <div class="relative z-10 flex items-start justify-between gap-3">
            <div>
              <p class="client-stat-label">Inspection</p>
              <p class="client-stat-value">{{ countByType('Inspection') }}</p>
              <p class="client-stat-hint">Site inspections</p>
            </div>
            <span class="client-stat-icon"><i data-lucide="clipboard-check" class="w-5 h-5"></i></span>
          </div>
        </button>
      </section>

      <section class="client-card client-card--lift p-5 flex flex-col sm:flex-row gap-4 sm:items-center">
        <div class="client-search flex-1 max-w-md">
          <i data-lucide="search" class="client-search-icon"></i>
          <input type="text" [(ngModel)]="search" placeholder="Search reports…" class="client-input" />
        </div>
        <select [(ngModel)]="activeFilter" class="client-input sm:w-48">
          <option *ngFor="let f of filters" [value]="f">{{ f }}</option>
        </select>
      </section>

      <section id="report-list" class="space-y-4" *ngIf="filteredReports.length > 0">
        <article *ngFor="let r of filteredReports" class="client-card client-card--lift p-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <span class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            [ngClass]="r.iconClass">
            <i [attr.data-lucide]="r.icon" class="w-6 h-6"></i>
          </span>
          <div class="flex-1 min-w-0">
            <h3 class="text-lg font-semibold text-[#0B1437]">{{ r.name }}</h3>
            <p class="text-base text-slate-500 mt-1">{{ r.description }}</p>
            <p class="text-sm text-slate-400 mt-2">{{ r.date }} · {{ r.type }}</p>
          </div>
          <button type="button" class="client-btn-secondary shrink-0">
            <i data-lucide="download" class="w-5 h-5"></i>
            Download {{ r.format }}
          </button>
        </article>
      </section>

      <section *ngIf="filteredReports.length === 0" class="client-card client-empty">
        <div class="client-empty-icon">
          <i data-lucide="file-text" class="w-8 h-8"></i>
        </div>
        <p class="text-lg font-semibold text-[#0B1437]">
          {{ reportQuickFilter !== 'all' ? 'No reports in this category' : 'No reports yet' }}
        </p>
        <p class="text-base text-slate-500 mt-2 max-w-md mx-auto">
          {{ reportQuickFilter !== 'all' ? 'Try another filter above.' : 'Reports will appear here after inspections are completed at your locations.' }}
        </p>
        <button *ngIf="reportQuickFilter !== 'all'" type="button" (click)="setReportFilter('all')"
          class="client-btn-secondary mt-4 inline-flex">Show all reports</button>
      </section>
    </div>
  `
})
export class Reports implements AfterViewInit {
  search = '';
  reportQuickFilter: 'all' | 'compliance' | 'inspection' = 'all';
  filters = ['All Reports', 'Inspection', 'Compliance', 'Inventory'];
  activeFilter = 'All Reports';

  reports = [
    {
      name: 'Quarterly Compliance Summary',
      description: 'Overview of extinguisher status across all locations',
      type: 'Compliance',
      iconClass: 'bg-blue-50 text-blue-600',
      icon: 'file-text',
      date: 'Jan 15, 2024',
      format: 'PDF'
    },
    {
      name: 'Warehouse A Inspection Report',
      description: 'Detailed inspection results and recommendations',
      type: 'Inspection',
      iconClass: 'bg-emerald-50 text-emerald-600',
      icon: 'clipboard-check',
      date: 'Dec 8, 2023',
      format: 'PDF'
    },
  ];

  get filteredReports() {
    let list = this.reports;
    if (this.reportQuickFilter === 'compliance') {
      list = list.filter(r => r.type === 'Compliance');
    } else if (this.reportQuickFilter === 'inspection') {
      list = list.filter(r => r.type === 'Inspection');
    } else if (this.activeFilter !== 'All Reports') {
      list = list.filter(r => r.type === this.activeFilter);
    }
    const q = this.search.trim().toLowerCase();
    if (q) {
      list = list.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
      );
    }
    return list;
  }

  setReportFilter(filter: 'all' | 'compliance' | 'inspection') {
    this.reportQuickFilter = filter;
    this.activeFilter = filter === 'all' ? 'All Reports' : filter === 'compliance' ? 'Compliance' : 'Inspection';
    document.getElementById('report-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => { if (typeof lucide !== 'undefined') lucide.createIcons(); }, 50);
  }

  countByType(type: string) {
    return this.reports.filter(r => r.type === type).length;
  }

  ngAfterViewInit() {
    setTimeout(() => { if (typeof lucide !== 'undefined') lucide.createIcons(); }, 50);
  }
}
