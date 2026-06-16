import { AfterViewInit, Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LocationService } from '../../services/location.service';
import { PaginationComponent } from '../../shared/pagination/pagination.component';

declare const lucide: { createIcons: () => void } | undefined;

@Component({
  selector: 'app-location-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PaginationComponent],
  template: `
    <div class="client-page">
      <div *ngIf="loading" class="text-center py-20 text-base text-slate-400">Loading location…</div>

      <div *ngIf="!loading && error" class="client-card client-empty">
        <p class="text-lg font-semibold text-[#0B1437]">{{ error }}</p>
        <a routerLink="/locations" class="client-btn-primary mt-6 inline-flex">Back to locations</a>
      </div>

      <ng-container *ngIf="!loading && location">
        <section class="client-hero">
          <div class="client-hero-inner flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <nav class="flex items-center gap-2 text-sm font-medium text-white/60 mb-3">
                <a routerLink="/locations" class="hover:text-white transition-colors">My locations</a>
                <span>/</span>
                <span class="text-white/90">{{ location.location_name }}</span>
              </nav>
              <h1 class="client-hero-title">{{ location.location_name }}</h1>
              <p class="client-hero-sub">{{ location.address || 'No address set' }}</p>
            </div>
            <button type="button" (click)="confirmDelete()" [disabled]="deleting"
              class="client-hero-btn shrink-0 bg-red-600/90 hover:bg-red-600 border-red-500/30">
              <i data-lucide="trash-2" class="w-5 h-5"></i>
              Delete location
            </button>
          </div>
        </section>

        <p *ngIf="actionMessage" class="mb-4 px-4 py-3 rounded-xl text-sm font-medium"
          [class.bg-emerald-50]="actionSuccess" [class.text-emerald-700]="actionSuccess"
          [class.bg-red-50]="!actionSuccess" [class.text-red-700]="!actionSuccess">
          {{ actionMessage }}
        </p>

        <!-- Units at this location -->
        <section class="client-card overflow-hidden mb-6">
          <div class="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100">
            <div>
              <h2 class="text-lg font-semibold text-[#0B1437]">Units at this location</h2>
              <p class="text-sm text-slate-500 mt-1">{{ location.extinguishers?.length || 0 }} assigned</p>
            </div>
            <button type="button" (click)="removeSelected()" [disabled]="selectedAssignedCount === 0 || busy"
              class="client-btn-secondary text-sm disabled:opacity-40">
              Remove selected ({{ selectedAssignedCount }})
            </button>
          </div>

          <div *ngIf="!location.extinguishers?.length" class="client-empty py-10">
            <p class="text-sm text-slate-500">No units assigned yet.</p>
          </div>

          <div *ngIf="location.extinguishers?.length" class="client-table-wrap">
            <table class="client-table">
              <thead>
                <tr>
                  <th class="w-10"></th>
                  <th>Serial number</th>
                  <th>Type & capacity</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let u of location.extinguishers">
                  <td>
                    <input type="checkbox"
                      [checked]="isAssignedSelected(u.id)"
                      (change)="toggleAssigned(u.id, $any($event.target).checked)"
                      class="w-4 h-4 rounded accent-[#0B1437]">
                  </td>
                  <td class="font-semibold text-[#0B1437]">{{ u.serial_number }}</td>
                  <td class="text-slate-600">{{ u.type }} · {{ u.capacity }}</td>
                  <td class="text-right">
                    <a [routerLink]="['/view-extinguisher', u.serial_number]"
                      class="text-sm font-medium text-blue-600 hover:underline">View</a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Add units -->
        <section class="client-card overflow-hidden">
          <div class="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100">
            <div>
              <h2 class="text-lg font-semibold text-[#0B1437]">Add units</h2>
              <p class="text-sm text-slate-500 mt-1">Select unassigned units from your inventory</p>
            </div>
            <button type="button" (click)="addSelected()" [disabled]="selectedAvailableCount === 0 || busy"
              class="client-btn-primary text-sm disabled:opacity-40">
              Add selected ({{ selectedAvailableCount }})
            </button>
          </div>

          <div class="p-5 border-b border-slate-100">
            <div class="client-search max-w-md">
              <i data-lucide="search" class="client-search-icon"></i>
              <input type="text" [(ngModel)]="unitSearch" (ngModelChange)="onUnitSearchChange()"
                placeholder="Search by serial e.g. FEMS-20260616-05ED2" class="client-input" />
            </div>
          </div>

          <div *ngIf="loadingAvailable" class="client-empty py-10 text-slate-400">Loading available units…</div>

          <div *ngIf="!loadingAvailable && availableUnits.length === 0" class="client-empty py-10">
            <p class="text-sm text-slate-500">
              {{ unitSearch ? 'No units match your search.' : 'All your units are already assigned to locations.' }}
            </p>
          </div>

          <div *ngIf="!loadingAvailable && availableUnits.length > 0" class="client-table-wrap">
            <table class="client-table">
              <thead>
                <tr>
                  <th class="w-10"></th>
                  <th>Serial number</th>
                  <th>Type & capacity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let u of availableUnits">
                  <td>
                    <input type="checkbox"
                      [checked]="isAvailableSelected(u.id)"
                      (change)="toggleAvailable(u.id, $any($event.target).checked)"
                      class="w-4 h-4 rounded accent-[#0B1437]">
                  </td>
                  <td class="font-semibold text-[#0B1437]">{{ u.serial_number }}</td>
                  <td class="text-slate-600">{{ u.type }} · {{ u.capacity }}</td>
                  <td class="text-slate-600">{{ u.status || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="px-5 pb-2" *ngIf="!loadingAvailable && availableTotal > 0">
            <app-pagination
              [page]="availablePage"
              [lastPage]="availableLastPage"
              [total]="availableTotal"
              (pageChange)="loadAvailable($event)">
            </app-pagination>
          </div>
        </section>
      </ng-container>
    </div>
  `
})
export class LocationDetailsComponent implements OnInit, AfterViewInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private locationService = inject(LocationService);
  private cdr = inject(ChangeDetectorRef);

  loading = true;
  busy = false;
  deleting = false;
  error = '';
  actionMessage = '';
  actionSuccess = true;
  location: any = null;
  locationId = '';

  selectedAssigned = new Set<number>();
  selectedAvailable = new Set<number>();

  availableUnits: any[] = [];
  loadingAvailable = false;
  availablePage = 1;
  availableLastPage = 1;
  availableTotal = 0;
  unitSearch = '';
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  get selectedAssignedCount() {
    return this.selectedAssigned.size;
  }

  get selectedAvailableCount() {
    return this.selectedAvailable.size;
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.locationId = id;
        this.load(id);
        this.loadAvailable(1);
      }
    });
  }

  load(id: string) {
    this.loading = true;
    this.error = '';
    this.selectedAssigned = new Set();
    this.locationService.getLocation(id).subscribe({
      next: (data) => {
        this.location = data;
        this.loading = false;
        this.cdr.detectChanges();
        this.refreshIcons();
      },
      error: (err) => {
        this.error = err.error?.message || 'Could not load this location.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadAvailable(page: number) {
    if (!this.locationId) return;
    this.loadingAvailable = true;
    this.availablePage = page;
    this.locationService.getAvailableUnits(this.locationId, page, 5, this.unitSearch).subscribe({
      next: (res) => {
        this.availableUnits = res.data ?? [];
        this.availableTotal = res.total ?? 0;
        this.availableLastPage = res.last_page ?? 1;
        this.loadingAvailable = false;
        this.cdr.detectChanges();
        this.refreshIcons();
      },
      error: () => {
        this.loadingAvailable = false;
        this.cdr.detectChanges();
      }
    });
  }

  onUnitSearchChange() {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.loadAvailable(1), 300);
  }

  private toId(id: number | string): number {
    return Number(id);
  }

  isAssignedSelected(id: number | string): boolean {
    return this.selectedAssigned.has(this.toId(id));
  }

  isAvailableSelected(id: number | string): boolean {
    return this.selectedAvailable.has(this.toId(id));
  }

  toggleAssigned(id: number | string, checked: boolean) {
    const numId = this.toId(id);
    const next = new Set(this.selectedAssigned);
    if (checked) next.add(numId);
    else next.delete(numId);
    this.selectedAssigned = next;
    this.cdr.detectChanges();
  }

  toggleAvailable(id: number | string, checked: boolean) {
    const numId = this.toId(id);
    const next = new Set(this.selectedAvailable);
    if (checked) next.add(numId);
    else next.delete(numId);
    this.selectedAvailable = next;
    this.cdr.detectChanges();
  }

  removeSelected() {
    if (!this.selectedAssigned.size || !this.location) return;
    this.busy = true;
    this.actionMessage = '';
    const ids = Array.from(this.selectedAssigned);
    this.locationService.removeUnits(this.location.id, ids).subscribe({
      next: (res) => {
        this.showAction(res.message || 'Units removed.', true);
        this.selectedAssigned = new Set();
        this.load(String(this.location.id));
        this.loadAvailable(this.availablePage);
        this.busy = false;
      },
      error: (err) => {
        this.showAction(err.error?.message || 'Failed to remove units.', false);
        this.busy = false;
      }
    });
  }

  addSelected() {
    if (!this.selectedAvailable.size || !this.location) return;
    this.busy = true;
    this.actionMessage = '';
    const ids = Array.from(this.selectedAvailable);
    this.locationService.addUnits(this.location.id, ids).subscribe({
      next: (res) => {
        this.showAction(res.message || 'Units added.', true);
        this.selectedAvailable = new Set();
        this.load(String(this.location.id));
        this.loadAvailable(1);
        this.busy = false;
      },
      error: (err) => {
        this.showAction(err.error?.message || 'Failed to add units.', false);
        this.busy = false;
      }
    });
  }

  confirmDelete() {
    if (!this.location || !confirm(`Delete "${this.location.location_name}"? Units will be unassigned but not deleted.`)) {
      return;
    }
    this.deleting = true;
    this.locationService.deleteLocation(this.location.id).subscribe({
      next: () => this.router.navigate(['/locations']),
      error: (err) => {
        this.showAction(err.error?.message || 'Failed to delete location.', false);
        this.deleting = false;
      }
    });
  }

  private showAction(msg: string, success: boolean) {
    this.actionMessage = msg;
    this.actionSuccess = success;
    this.cdr.detectChanges();
  }

  ngAfterViewInit() {
    this.refreshIcons();
  }

  private refreshIcons() {
    setTimeout(() => lucide?.createIcons?.(), 50);
  }
}
