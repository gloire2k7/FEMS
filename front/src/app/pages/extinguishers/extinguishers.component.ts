import { AfterViewInit, Component, NgZone, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ExtinguisherService } from '../../services/extinguisher.service';
import { PaginationComponent } from '../../shared/pagination/pagination.component';

declare const lucide: { createIcons: (opts?: { nameAttr?: string }) => void } | undefined;

type StatusFilter = 'all' | 'valid' | 'attention';

@Component({
  selector: 'app-extinguishers',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PaginationComponent],
  templateUrl: './extinguishers.html',
})
export class ExtinguishersComponent implements OnInit, AfterViewInit {
  private extService = inject(ExtinguisherService);
  private route = inject(ActivatedRoute);
  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);

  loading = true;
  search = '';
  statusFilter: StatusFilter = 'all';
  page = 1;
  lastPage = 1;
  total = 0;
  units: any[] = [];

  get filteredUnits() {
    let list = this.units;

    if (this.statusFilter === 'valid') {
      list = list.filter(u => !this.needsAttention(u));
    } else if (this.statusFilter === 'attention') {
      list = list.filter(u => this.needsAttention(u));
    }

    const q = this.search.trim().toLowerCase();
    if (q) {
      list = list.filter(u =>
        (u.serial_number || '').toLowerCase().includes(q) ||
        (u.type || '').toLowerCase().includes(q) ||
        (u.capacity || '').toLowerCase().includes(q)
      );
    }
    return list;
  }

  get stats() {
    const list = this.units;
    let valid = 0;
    let attention = 0;
    for (const u of list) {
      if (this.needsAttention(u)) attention++;
      else valid++;
    }
    return { total: this.total || list.length, valid, attention };
  }

  ngOnInit() {
    const filter = this.route.snapshot.queryParamMap.get('filter');
    if (filter === 'valid' || filter === 'attention') {
      this.statusFilter = filter;
    }
    this.load(1);
  }

  setStatusFilter(filter: StatusFilter) {
    this.statusFilter = filter;
    this.scrollToList();
    this.refreshIcons();
    this.cdr.detectChanges();
  }

  needsAttention(u: any): boolean {
    if (u.expiry_date && new Date(u.expiry_date) < new Date()) return true;
    const s = (u.status || '').toLowerCase();
    return s === 'maintenance' || s === 'under_maintenance';
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
        this.cdr.detectChanges();
        this.refreshIcons();
        if (this.statusFilter !== 'all') {
          setTimeout(() => this.scrollToList(), 100);
        }
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
    if (this.statusFilter !== 'all') {
      setTimeout(() => this.scrollToList(), 200);
    }
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

  private scrollToList() {
    document.getElementById('extinguisher-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
