import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

declare const lucide: { createIcons: () => void } | undefined;

export type InspectionStatus = 'passed' | 'refill' | 'expired' | 'pending';

export interface AssignedInspection {
  id: string;
  location: string;
  inspector: string;
  date: string;
  status: InspectionStatus;
  notes?: string;
}

@Component({
  selector: 'app-admin-assigned-inspections',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-assigned-inspections.html',
  styleUrl: './admin-assigned-inspections.css',
})
export class AdminAssignedInspections implements AfterViewInit {
  searchTerm = '';
  statusFilter: 'all' | InspectionStatus = 'all';
  selected: AssignedInspection | null = null;

  inspections: AssignedInspection[] = [
    { id: 'EXT-2023-89', location: 'Building A, Floor 2', inspector: 'Sarah Jenkins', date: '2024-10-24', status: 'passed', notes: 'All readings within normal range. Seal intact.' },
    { id: 'EXT-2023-42', location: 'Warehouse Zone B', inspector: 'Mike Ross', date: '2024-10-23', status: 'refill', notes: 'Pressure below green zone. Bracket screws loose — refill recommended.' },
    { id: 'EXT-2020-11', location: 'Cafeteria Kitchen', inspector: 'Elena Fisher', date: '2024-10-22', status: 'expired', notes: 'Certification period exceeded. Unit flagged for replacement.' },
    { id: 'EXT-2024-01', location: 'Main Hall Lobby', inspector: 'John Doe', date: '2024-10-21', status: 'pending', notes: 'Awaiting admin review.' },
  ];

  constructor(private router: Router) {}

  get filteredInspections() {
    let list = this.inspections;
    if (this.statusFilter !== 'all') {
      list = list.filter((i) => i.status === this.statusFilter);
    }
    const q = this.searchTerm.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (i) =>
        i.id.toLowerCase().includes(q) ||
        i.location.toLowerCase().includes(q) ||
        i.inspector.toLowerCase().includes(q)
    );
  }

  get pendingCount() {
    return this.inspections.filter((i) => i.status === 'pending').length;
  }

  get passedCount() {
    return this.inspections.filter((i) => i.status === 'passed').length;
  }

  get issueCount() {
    return this.inspections.filter((i) => i.status === 'refill' || i.status === 'expired').length;
  }

  select(item: AssignedInspection) {
    this.selected = item;
    this.refreshIcons();
  }

  approveInspection() {
    this.router.navigate(['/admin-inventory']);
  }

  setFilter(filter: 'all' | InspectionStatus) {
    this.statusFilter = filter;
    this.refreshIcons();
  }

  statusLabel(s: InspectionStatus): string {
    return { passed: 'Passed', refill: 'Needs refill', expired: 'Expired', pending: 'Pending review' }[s];
  }

  statusClass(s: InspectionStatus): string {
    return {
      passed: 'bg-emerald-50 text-emerald-700 ring-emerald-200/60',
      refill: 'bg-amber-50 text-amber-700 ring-amber-200/60',
      expired: 'bg-red-50 text-red-700 ring-red-200/60',
      pending: 'bg-sky-50 text-sky-700 ring-sky-200/60',
    }[s];
  }

  ngAfterViewInit() {
    this.refreshIcons();
  }

  private refreshIcons() {
    setTimeout(() => lucide?.createIcons?.(), 0);
    setTimeout(() => lucide?.createIcons?.(), 120);
  }
}
