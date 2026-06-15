import { AfterViewInit, Component, NgZone, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ExtinguisherService } from '../../services/extinguisher.service';
import { PaginationComponent } from '../../shared/pagination/pagination.component';

declare const lucide: { createIcons: (opts?: { nameAttr?: string }) => void } | undefined;

@Component({
  selector: 'app-extinguishers',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PaginationComponent],
  templateUrl: './extinguishers.html',
})
export class ExtinguishersComponent implements OnInit, AfterViewInit {
  private extService = inject(ExtinguisherService);
  private ngZone = inject(NgZone);

  loading = true;
  search = '';
  page = 1;
  lastPage = 1;
  total = 0;
  units: any[] = [];

  get filteredUnits() {
    const q = this.search.trim().toLowerCase();
    if (!q) return this.units;
    return this.units.filter(u =>
      (u.serial_number || '').toLowerCase().includes(q) ||
      (u.type || '').toLowerCase().includes(q) ||
      (u.capacity || '').toLowerCase().includes(q)
    );
  }

  get stats() {
    const list = this.units;
    const now = Date.now();
    let valid = 0;
    let attention = 0;
    for (const u of list) {
      const exp = u.expiry_date ? new Date(u.expiry_date).getTime() : null;
      if (exp && exp < now) attention++;
      else valid++;
    }
    return { total: this.total || list.length, valid, attention };
  }

  ngOnInit() {
    this.load(1);
  }

  load(page: number) {
    this.loading = true;
    this.page = page;
    this.extService.getExtinguishers(page, 15).subscribe({
      next: (res) => {
        this.units = res.data ?? res ?? [];
        this.page = res.page ?? page;
        this.lastPage = res.last_page ?? 1;
        this.total = res.total ?? this.units.length;
        this.loading = false;
        this.refreshIcons();
      },
      error: () => {
        this.units = [];
        this.loading = false;
        this.refreshIcons();
      }
    });
  }

  ngAfterViewInit() {
    this.refreshIcons();
  }

  statusLabel(u: any): string {
    if (u.expiry_date && new Date(u.expiry_date) < new Date()) return 'Expired';
    const s = (u.status || '').toLowerCase();
    if (s === 'maintenance' || s === 'under_maintenance') return 'In service';
    if (s === 'filled' || s === 'active') return 'Valid';
    return u.status || '—';
  }

  statusClass(u: any): string {
    const label = this.statusLabel(u);
    if (label === 'Expired') return 'bg-red-50 text-red-700';
    if (label === 'In service') return 'bg-blue-50 text-blue-700';
    return 'bg-emerald-50 text-emerald-700';
  }

  private refreshIcons() {
    const run = () => {
      if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
    };
    run();
    this.ngZone.runOutsideAngular(() => {
      setTimeout(run, 0);
      setTimeout(run, 150);
    });
  }
}
