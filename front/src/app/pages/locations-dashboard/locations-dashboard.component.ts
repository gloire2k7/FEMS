import { Component, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

declare const lucide: { createIcons: () => void } | undefined;

interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  totalExtinguishers: number;
  status: 'compliant' | 'attention' | 'critical';
  lastInspection: string;
}

@Component({
  selector: 'app-locations-dashboard',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  template: `
    <div class="client-page">
      <section class="client-hero">
        <div class="client-hero-inner flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p class="client-hero-eyebrow">Your sites</p>
            <h1 class="client-hero-title">My Locations</h1>
            <p class="client-hero-sub">Sites where your fire extinguishers are installed and maintained.</p>
          </div>
          <a routerLink="/extinguishers" class="client-hero-btn shrink-0">
            <i data-lucide="flame" class="w-5 h-5"></i>
            View units
          </a>
        </div>
      </section>

      <section class="client-stat-grid">
        <div class="client-stat client-stat--primary">
          <div class="relative z-10 flex items-start justify-between gap-3">
            <div>
              <p class="client-stat-label">Locations</p>
              <p class="client-stat-value">{{ locations.length }}</p>
              <p class="client-stat-hint">Active sites</p>
            </div>
            <span class="client-stat-icon"><i data-lucide="map-pin" class="w-5 h-5"></i></span>
          </div>
        </div>
        <div class="client-stat client-stat--featured">
          <div class="relative z-10 flex items-start justify-between gap-3">
            <div>
              <p class="client-stat-label">Total units</p>
              <p class="client-stat-value">{{ totalUnits }}</p>
              <p class="client-stat-hint">Across all sites</p>
            </div>
            <span class="client-stat-icon"><i data-lucide="flame" class="w-5 h-5"></i></span>
          </div>
        </div>
        <div class="client-stat client-stat--warning">
          <div class="relative z-10 flex items-start justify-between gap-3">
            <div>
              <p class="client-stat-label">Needs attention</p>
              <p class="client-stat-value">{{ attentionCount }}</p>
              <p class="client-stat-hint">Sites to review</p>
            </div>
            <span class="client-stat-icon"><i data-lucide="alert-triangle" class="w-5 h-5"></i></span>
          </div>
        </div>
      </section>

      <section class="client-card client-card--lift p-5">
        <div class="relative max-w-md">
          <i data-lucide="search" class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input type="text" [(ngModel)]="searchTerm" placeholder="Search locations…" class="client-input pl-10" />
        </div>
      </section>

      <section class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <article *ngFor="let loc of filteredLocations" class="client-card client-card--lift p-6">
          <div class="flex items-start justify-between gap-3 mb-4">
            <div>
              <h3 class="text-lg font-semibold text-[#0B1437]">{{ loc.name }}</h3>
              <p class="text-base text-slate-500 mt-1">{{ loc.address }}, {{ loc.city }}</p>
            </div>
            <span class="client-badge shrink-0"
              [class.bg-emerald-50]="loc.status === 'compliant'"
              [class.text-emerald-700]="loc.status === 'compliant'"
              [class.bg-amber-50]="loc.status === 'attention'"
              [class.text-amber-700]="loc.status === 'attention'"
              [class.bg-red-50]="loc.status === 'critical'"
              [class.text-red-700]="loc.status === 'critical'">
              {{ statusLabel(loc.status) }}
            </span>
          </div>
          <div class="grid grid-cols-2 gap-4 text-base">
            <div>
              <p class="text-sm text-slate-500">Extinguishers</p>
              <p class="text-xl font-bold text-[#0B1437]">{{ loc.totalExtinguishers }}</p>
            </div>
            <div>
              <p class="text-sm text-slate-500">Last inspection</p>
              <p class="text-base font-medium text-[#0B1437]">{{ loc.lastInspection | date:'mediumDate' }}</p>
            </div>
          </div>
        </article>
      </section>

      <section *ngIf="filteredLocations.length === 0" class="client-card client-empty">
        <div class="client-empty-icon">
          <i data-lucide="map-pin" class="w-8 h-8"></i>
        </div>
        <p class="text-lg font-semibold text-[#0B1437]">No locations found</p>
        <p class="text-base text-slate-500 mt-2">Locations are added when extinguishers are assigned to your sites.</p>
        <a routerLink="/extinguishers" class="client-btn-secondary mt-6 inline-flex">View extinguishers</a>
      </section>
    </div>
  `
})
export class LocationsDashboardComponent implements AfterViewInit {
  searchTerm = '';

  locations: Location[] = [
    { id: '1', name: 'Head Office', address: 'KN 4 Ave', city: 'Kigali', totalExtinguishers: 12, status: 'compliant', lastInspection: '2024-11-15' },
    { id: '2', name: 'Warehouse A', address: 'KG 15 St', city: 'Gasabo', totalExtinguishers: 28, status: 'attention', lastInspection: '2024-09-20' },
    { id: '3', name: 'Retail Branch', address: 'KK 3 Rd', city: 'Kicukiro', totalExtinguishers: 8, status: 'compliant', lastInspection: '2024-12-01' },
  ];

  get filteredLocations() {
    const q = this.searchTerm.trim().toLowerCase();
    if (!q) return this.locations;
    return this.locations.filter(l =>
      l.name.toLowerCase().includes(q) ||
      l.address.toLowerCase().includes(q) ||
      l.city.toLowerCase().includes(q)
    );
  }

  get totalUnits() {
    return this.locations.reduce((s, l) => s + l.totalExtinguishers, 0);
  }

  get attentionCount() {
    return this.locations.filter(l => l.status !== 'compliant').length;
  }

  statusLabel(s: string) {
    return ({ compliant: 'Compliant', attention: 'Needs review', critical: 'Critical' } as any)[s] || s;
  }

  ngAfterViewInit() {
    setTimeout(() => { if (typeof lucide !== 'undefined') lucide.createIcons(); }, 50);
  }
}
