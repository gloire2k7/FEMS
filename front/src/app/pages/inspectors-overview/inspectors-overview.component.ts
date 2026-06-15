import { Component, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

declare const lucide: { createIcons: () => void } | undefined;

interface Inspector {
  id: string;
  name: string;
  title: string;
  location: string;
  status: 'available' | 'busy';
  phone: string;
  email: string;
}

@Component({
  selector: 'app-inspectors-overview',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  template: `
    <div class="client-page">
      <section class="client-hero">
        <div class="client-hero-inner flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p class="client-hero-eyebrow">Your team</p>
            <h1 class="client-hero-title">Inspectors</h1>
            <p class="client-hero-sub">Certified inspectors assigned to support your fire safety compliance.</p>
          </div>
          <a routerLink="/service-requests" class="client-hero-btn shrink-0">
            <i data-lucide="calendar" class="w-5 h-5"></i>
            Schedule service
          </a>
        </div>
      </section>

      <section class="client-stat-grid">
        <div class="client-stat client-stat--primary">
          <div class="relative z-10 flex items-start justify-between gap-3">
            <div>
              <p class="client-stat-label">Total inspectors</p>
              <p class="client-stat-value">{{ inspectors.length }}</p>
              <p class="client-stat-hint">On your account</p>
            </div>
            <span class="client-stat-icon"><i data-lucide="users" class="w-5 h-5"></i></span>
          </div>
        </div>
        <div class="client-stat client-stat--featured">
          <div class="relative z-10 flex items-start justify-between gap-3">
            <div>
              <p class="client-stat-label">Available</p>
              <p class="client-stat-value">{{ availableCount }}</p>
              <p class="client-stat-hint">Ready to assign</p>
            </div>
            <span class="client-stat-icon"><i data-lucide="user-check" class="w-5 h-5"></i></span>
          </div>
        </div>
        <div class="client-stat client-stat--warning">
          <div class="relative z-10 flex items-start justify-between gap-3">
            <div>
              <p class="client-stat-label">On assignment</p>
              <p class="client-stat-value">{{ busyCount }}</p>
              <p class="client-stat-hint">Currently booked</p>
            </div>
            <span class="client-stat-icon"><i data-lucide="briefcase" class="w-5 h-5"></i></span>
          </div>
        </div>
      </section>

      <section class="client-card client-card--lift p-5">
        <div class="relative max-w-md">
          <i data-lucide="search" class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input type="text" [(ngModel)]="searchTerm" placeholder="Search by name or location…"
            class="client-input pl-10" />
        </div>
      </section>

      <section class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <article *ngFor="let i of filteredInspectors" class="client-card client-card--lift p-6">
          <div class="flex items-start gap-4">
            <img [src]="'https://ui-avatars.com/api/?name=' + i.name + '&background=0B1437&color=fff&size=96'"
              [alt]="i.name" class="w-14 h-14 rounded-xl shrink-0" />
            <div class="min-w-0 flex-1">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <h3 class="text-lg font-semibold text-[#0B1437]">{{ i.name }}</h3>
                  <p class="text-base text-slate-500">{{ i.title }}</p>
                </div>
                <span class="client-badge shrink-0"
                  [class.bg-emerald-50]="i.status === 'available'"
                  [class.text-emerald-700]="i.status === 'available'"
                  [class.bg-amber-50]="i.status === 'busy'"
                  [class.text-amber-700]="i.status === 'busy'">
                  {{ i.status === 'available' ? 'Available' : 'On assignment' }}
                </span>
              </div>
              <p class="text-base text-slate-600 mt-3 flex items-center gap-2">
                <i data-lucide="map-pin" class="w-4 h-4 text-slate-400 shrink-0"></i>
                {{ i.location }}
              </p>
              <div class="flex flex-wrap gap-3 mt-4 text-sm text-slate-500">
                <a [href]="'tel:' + i.phone" class="hover:text-[#0B1437]">{{ i.phone }}</a>
                <span class="text-slate-300">·</span>
                <a [href]="'mailto:' + i.email" class="hover:text-[#0B1437] truncate">{{ i.email }}</a>
              </div>
            </div>
          </div>
        </article>
      </section>

      <section *ngIf="filteredInspectors.length === 0" class="client-card client-empty">
        <p class="text-lg font-semibold text-[#0B1437]">No inspectors match your search</p>
        <p class="text-base text-slate-500 mt-2">Try a different name or location.</p>
      </section>

      <section class="client-card p-6 bg-slate-50/50">
        <div class="flex items-start gap-4">
          <span class="w-12 h-12 rounded-xl bg-[#0B1437] flex items-center justify-center shrink-0">
            <i data-lucide="calendar" class="w-6 h-6 text-white"></i>
          </span>
          <div>
            <h2 class="text-lg font-semibold text-[#0B1437]">Need to schedule an inspection?</h2>
            <p class="text-base text-slate-600 mt-1">Contact our team or submit a service request and we'll assign the right inspector.</p>
            <a routerLink="/service-requests" class="client-btn-primary mt-4 inline-flex">Request service</a>
          </div>
        </div>
      </section>
    </div>
  `
})
export class InspectorsOverviewComponent implements AfterViewInit {
  searchTerm = '';

  inspectors: Inspector[] = [
    { id: '1', name: 'Sarah Johnson', title: 'Senior Fire Safety Inspector', location: 'Kigali', status: 'available', phone: '+250 788 000 001', email: 'sarah.j@fems.com' },
    { id: '2', name: 'Michael Chen', title: 'Compliance Inspector', location: 'Gasabo', status: 'busy', phone: '+250 788 000 002', email: 'michael.c@fems.com' },
    { id: '3', name: 'Emily Rodriguez', title: 'Safety Compliance Officer', location: 'Kicukiro', status: 'available', phone: '+250 788 000 003', email: 'emily.r@fems.com' },
  ];

  get filteredInspectors() {
    const q = this.searchTerm.trim().toLowerCase();
    if (!q) return this.inspectors;
    return this.inspectors.filter(i =>
      i.name.toLowerCase().includes(q) ||
      i.location.toLowerCase().includes(q) ||
      i.title.toLowerCase().includes(q)
    );
  }

  get availableCount() {
    return this.inspectors.filter(i => i.status === 'available').length;
  }

  get busyCount() {
    return this.inspectors.filter(i => i.status === 'busy').length;
  }

  ngAfterViewInit() {
    setTimeout(() => { if (typeof lucide !== 'undefined') lucide.createIcons(); }, 50);
  }
}
