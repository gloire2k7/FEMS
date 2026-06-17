import { AfterViewInit, Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ComplianceService, ComplianceAlert } from '../../services/compliance.service';

declare const lucide: { createIcons: () => void } | undefined;

@Component({
  selector: 'app-admin-compliance',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-compliance.html',
  styleUrl: './admin-compliance.css',
})
export class AdminCompliance implements OnInit, AfterViewInit {
  private svc = inject(ComplianceService);
  private cdr = inject(ChangeDetectorRef);

  loading = true;
  loadError = '';
  searchTerm = '';
  urgencyFilter: 'all' | 'URGENT' | 'HIGH' | 'MEDIUM' = 'all';
  alerts: ComplianceAlert[] = [];
  urgentCount = 0;
  highCount = 0;

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.loadError = '';
    this.svc.getAlerts().subscribe({
      next: (res) => {
        this.alerts = res.alerts ?? [];
        this.urgentCount = res.urgentCount ?? 0;
        this.highCount = res.highCount ?? 0;
        this.loading = false;
        this.cdr.detectChanges();
        this.refreshIcons();
      },
      error: () => {
        this.loadError = 'Could not load compliance alerts.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get filteredAlerts() {
    let list = this.alerts;
    if (this.urgencyFilter !== 'all') {
      list = list.filter((a) => a.urgency === this.urgencyFilter);
    }
    const q = this.searchTerm.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (a) =>
        a.extinguisherId.toLowerCase().includes(q) ||
        a.location.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q)
    );
  }

  setUrgencyFilter(filter: 'all' | 'URGENT' | 'HIGH' | 'MEDIUM') {
    this.urgencyFilter = filter;
    this.refreshIcons();
  }

  urgencyClass(u: string): string {
    return ({
      URGENT: 'border-l-red-500 bg-red-50/30',
      HIGH: 'border-l-amber-500 bg-amber-50/20',
      MEDIUM: 'border-l-blue-500',
    } as Record<string, string>)[u] || '';
  }

  urgencyBadge(u: string): string {
    return ({
      URGENT: 'bg-red-100 text-red-700',
      HIGH: 'bg-amber-100 text-amber-700',
      MEDIUM: 'bg-blue-100 text-blue-700',
    } as Record<string, string>)[u] || '';
  }

  ngAfterViewInit() {
    this.refreshIcons();
  }

  private refreshIcons() {
    setTimeout(() => lucide?.createIcons?.(), 0);
    setTimeout(() => lucide?.createIcons?.(), 120);
  }
}
