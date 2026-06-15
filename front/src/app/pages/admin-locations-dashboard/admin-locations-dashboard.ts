import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

declare const lucide: { createIcons: () => void } | undefined;

export type LocationStatus = 'compliant' | 'refill' | 'expired';

export interface AdminLocation {
  id: string;
  name: string;
  zone: string;
  totalExtinguishers: number;
  status: LocationStatus;
  lastInspection: string;
  clientName?: string;
}

@Component({
  selector: 'app-admin-locations-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-locations-dashboard.html',
  styleUrl: './admin-locations-dashboard.css',
})
export class AdminLocationsDashboard implements AfterViewInit {
  searchTerm = '';
  statusFilter: 'all' | LocationStatus = 'all';

  locations: AdminLocation[] = [
    { id: '1', name: 'Main Hall', zone: 'Block A, Ground Floor', totalExtinguishers: 24, status: 'compliant', lastInspection: '2024-12-02', clientName: 'TechCorp' },
    { id: '2', name: 'Warehouse B', zone: 'Logistics Area', totalExtinguishers: 56, status: 'refill', lastInspection: '2024-11-18', clientName: 'Global Logistics' },
    { id: '3', name: 'Central Kitchen', zone: 'Staff Block', totalExtinguishers: 12, status: 'expired', lastInspection: '2024-08-10', clientName: 'City Mall' },
    { id: '4', name: 'Office Block', zone: 'Floors 1–4', totalExtinguishers: 42, status: 'compliant', lastInspection: '2024-11-28', clientName: 'TechCorp' },
    { id: '5', name: 'Underground Parking', zone: 'Levels B1–B2', totalExtinguishers: 30, status: 'refill', lastInspection: '2024-10-05', clientName: 'Metro Plaza' },
    { id: '6', name: 'Server Room', zone: 'Building C', totalExtinguishers: 8, status: 'compliant', lastInspection: '2024-12-01', clientName: 'DataHost Ltd' },
  ];

  get filteredLocations() {
    let list = this.locations;
    if (this.statusFilter !== 'all') {
      list = list.filter((l) => l.status === this.statusFilter);
    }
    const q = this.searchTerm.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.zone.toLowerCase().includes(q) ||
        (l.clientName || '').toLowerCase().includes(q)
    );
  }

  get totalLocations() {
    return this.locations.length;
  }

  get totalUnits() {
    return this.locations.reduce((s, l) => s + l.totalExtinguishers, 0);
  }

  get expiredCount() {
    return this.locations.filter((l) => l.status === 'expired').length;
  }

  get refillCount() {
    return this.locations.filter((l) => l.status === 'refill').length;
  }

  setFilter(filter: 'all' | LocationStatus) {
    this.statusFilter = filter;
    this.refreshIcons();
  }

  statusLabel(status: LocationStatus): string {
    return { compliant: 'Compliant', refill: 'Needs refill', expired: 'Expired' }[status];
  }

  statusBadgeClass(status: LocationStatus): string {
    return {
      compliant: 'bg-emerald-50 text-emerald-700 ring-emerald-200/60',
      refill: 'bg-amber-50 text-amber-700 ring-amber-200/60',
      expired: 'bg-red-50 text-red-700 ring-red-200/60',
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
