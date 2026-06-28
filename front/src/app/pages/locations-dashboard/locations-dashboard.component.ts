import { AfterViewInit, Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LocationService } from '../../services/location.service';
import { PaginationComponent } from '../../shared/pagination/pagination.component';

declare const lucide: { createIcons: () => void } | undefined;

@Component({
  selector: 'app-locations-dashboard',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule, PaginationComponent],
  template: `
    <div class="client-page">
      <section class="client-hero">
        <div class="client-hero-inner flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p class="client-hero-eyebrow">Your sites</p>
            <h1 class="client-hero-title">My Locations</h1>
            <p class="client-hero-sub">Organize your fire extinguishers by site or building.</p>
          </div>
          <button type="button" (click)="showCreateForm = !showCreateForm" class="client-hero-btn shrink-0">
            <i data-lucide="plus" class="w-5 h-5"></i>
            New location
          </button>
        </div>
      </section>

      <section *ngIf="showCreateForm" class="client-card p-6 mb-6">
        <h2 class="text-lg font-semibold text-[#0B1437] mb-4">Create a location</h2>
        <p *ngIf="createError" class="text-sm text-red-600 mb-3">{{ createError }}</p>
        <div class="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-1">Location name *</label>
            <input type="text" [(ngModel)]="newName" placeholder="e.g. Head Office" class="client-input w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-1">Address</label>
            <input type="text" [(ngModel)]="newAddress" placeholder="Street, city" class="client-input w-full" />
          </div>
        </div>
        <div class="flex gap-3">
          <button type="button" (click)="createLocation()" [disabled]="creating || !newName.trim()"
            class="client-btn-primary disabled:opacity-40">Create</button>
          <button type="button" (click)="showCreateForm = false" class="client-btn-secondary">Cancel</button>
        </div>
      </section>

      <section class="client-card client-card--lift p-5 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div class="client-search flex-1 max-w-md">
          <i data-lucide="search" class="client-search-icon"></i>
          <input type="text" [(ngModel)]="searchTerm" placeholder="Search locations…" class="client-input" />
        </div>
        <p class="text-sm text-slate-500 shrink-0">{{ total }} location{{ total === 1 ? '' : 's' }} · {{ assignedUnits }} units assigned</p>
      </section>

      <section id="location-list" class="client-card overflow-hidden">
        <div *ngIf="loading" class="client-empty text-slate-400 text-base">Loading locations…</div>

        <div *ngIf="!loading && filteredLocations.length === 0" class="client-empty">
          <p class="text-lg font-semibold text-[#0B1437]">No locations found</p>
          <p class="text-base text-slate-500 mt-2">
            {{ searchTerm ? 'Try a different search.' : 'Create your first location to organize your units.' }}
          </p>
          <button *ngIf="!searchTerm" type="button" (click)="showCreateForm = true"
            class="client-btn-primary mt-6 inline-flex">Create location</button>
        </div>

        <div *ngIf="!loading && filteredLocations.length > 0" class="client-table-wrap">
          <table class="client-table">
            <thead>
              <tr>
                <th>Location</th>
                <th>Address</th>
                <th>Units</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let loc of filteredLocations">
                <td>
                  <a [routerLink]="['/locations', loc.id]"
                    class="font-semibold text-[#0B1437] hover:underline">
                    {{ loc.location_name }}
                  </a>
                </td>
                <td class="text-slate-600">{{ loc.address || '—' }}</td>
                <td>{{ loc.unit_count || 0 }}</td>
                <td class="text-right">
                  <a [routerLink]="['/locations', loc.id]"
                    class="text-sm font-medium text-blue-600 hover:underline">Manage</a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="px-5 pb-2" *ngIf="!loading && total > 0 && !searchTerm">
          <app-pagination [page]="page" [lastPage]="lastPage" [total]="total" (pageChange)="load($event)" />
        </div>
      </section>
    </div>
  `
})
export class LocationsDashboardComponent implements OnInit, AfterViewInit {
  private locationService = inject(LocationService);
  private cdr = inject(ChangeDetectorRef);

  loading = true;
  locations: any[] = [];
  page = 1;
  lastPage = 1;
  total = 0;
  assignedUnits = 0;
  searchTerm = '';
  showCreateForm = false;
  newName = '';
  newAddress = '';
  creating = false;
  createError = '';

  get filteredLocations() {
    const q = this.searchTerm.trim().toLowerCase();
    if (!q) return this.locations;
    return this.locations.filter(l =>
      (l.location_name || '').toLowerCase().includes(q) ||
      (l.address || '').toLowerCase().includes(q)
    );
  }

  ngOnInit() {
    this.load(1);
  }

  load(page: number) {
    this.loading = true;
    this.page = page;
    this.locationService.getLocations(page, 5).subscribe({
      next: (res) => {
        this.locations = res.data ?? [];
        this.total = res.total ?? 0;
        this.lastPage = res.last_page ?? 1;
        this.assignedUnits = res.assigned_units ?? 0;
        this.loading = false;
        this.cdr.detectChanges();
        this.refreshIcons();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  createLocation() {
    const name = this.newName.trim();
    if (!name) return;
    this.creating = true;
    this.createError = '';
    this.locationService.createLocation({ location_name: name, address: this.newAddress.trim() || undefined }).subscribe({
      next: () => {
        this.newName = '';
        this.newAddress = '';
        this.showCreateForm = false;
        this.creating = false;
        this.load(1);
      },
      error: (err) => {
        this.createError = err.error?.message || 'Failed to create location.';
        this.creating = false;
        this.cdr.detectChanges();
      }
    });
  }

  ngAfterViewInit() {
    this.refreshIcons();
  }

  private refreshIcons() {
    setTimeout(() => lucide?.createIcons?.(), 50);
  }
}
