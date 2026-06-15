import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

declare const lucide: { createIcons: () => void } | undefined;

export type RefillStatus = 'Pending' | 'In Progress' | 'Completed' | 'Condemned';

export interface RefillRequest {
  id: string;
  extinguisherId: string;
  type: string;
  capacity: string;
  location: string;
  subLocation: string;
  issue: string;
  requestDate: string;
  dueDate?: string;
  doneDate?: string;
  status: RefillStatus;
  technician?: string;
}

@Component({
  selector: 'app-admin-refills',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-refills.html',
  styleUrls: ['./admin-refills.css'],
})
export class AdminRefills implements AfterViewInit {
  searchTerm = '';
  statusFilter: 'all' | RefillStatus = 'all';

  refillRequests: RefillRequest[] = [
    { id: '1', extinguisherId: 'EXT-00142', type: 'CO₂', capacity: '5kg', location: 'Tech Corp HQ', subLocation: 'Server Room B', issue: 'Refill required', requestDate: '2024-10-24', dueDate: '2024-10-26', status: 'Pending' },
    { id: '2', extinguisherId: 'EXT-00892', type: 'Dry Powder', capacity: '9kg', location: 'Westside Warehouse', subLocation: 'Loading Dock 4', issue: 'Valve repair', requestDate: '2024-10-22', status: 'In Progress', technician: 'Mike R.' },
    { id: '3', extinguisherId: 'EXT-00221', type: 'Foam', capacity: '6L', location: 'City Mall', subLocation: 'Food Court', issue: 'Inspection failed', requestDate: '2024-10-10', dueDate: 'Overdue', status: 'Condemned' },
    { id: '4', extinguisherId: 'EXT-00445', type: 'Water', capacity: '9L', location: 'Office Block A', subLocation: 'Lobby', issue: 'Routine check', requestDate: '2024-10-20', doneDate: '2024-10-21', status: 'Completed', technician: 'Sarah L.' },
  ];

  get filteredRequests() {
    let list = this.refillRequests;
    if (this.statusFilter !== 'all') {
      list = list.filter((r) => r.status === this.statusFilter);
    }
    const q = this.searchTerm.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (r) =>
        r.extinguisherId.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q)
    );
  }

  get pendingCount() {
    return this.refillRequests.filter((r) => r.status === 'Pending').length;
  }

  get inProgressCount() {
    return this.refillRequests.filter((r) => r.status === 'In Progress').length;
  }

  get completedCount() {
    return this.refillRequests.filter((r) => r.status === 'Completed').length;
  }

  setStatusFilter(filter: 'all' | RefillStatus) {
    this.statusFilter = filter;
    this.refreshIcons();
  }

  statusClass(status: RefillStatus): string {
    return {
      Pending: 'bg-amber-50 text-amber-700 ring-amber-200/60',
      'In Progress': 'bg-blue-50 text-blue-700 ring-blue-200/60',
      Completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200/60',
      Condemned: 'bg-red-50 text-red-700 ring-red-200/60',
    }[status];
  }

  ngAfterViewInit() {
    this.refreshIcons();
  }

  private refreshIcons() {
    setTimeout(() => lucide?.createIcons?.(), 0);
    setTimeout(() => lucide?.createIcons?.(), 120);
  }
}
