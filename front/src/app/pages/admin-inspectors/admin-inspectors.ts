import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

declare const lucide: { createIcons: () => void } | undefined;

export interface AdminInspector {
  id: string;
  name: string;
  email: string;
  phone: string;
  base: string;
  status: 'Active' | 'Inactive';
  availability: 'Available' | 'Busy' | 'On Leave';
  totalInspections: number;
  completionRate: number;
  avatar: string;
}

@Component({
  selector: 'app-admin-inspectors',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-inspectors.html',
  styleUrl: './admin-inspectors.css',
})
export class AdminInspectors implements AfterViewInit {
  searchTerm = '';
  statusFilter: 'all' | 'Active' | 'Inactive' = 'all';
  selectedInspector: AdminInspector | null = null;

  inspectors: AdminInspector[] = [
    { id: 'INS-1024', name: 'John Doe', email: 'john.d@fems.com', phone: '+250 788 000 001', base: 'Central District', status: 'Active', availability: 'Available', totalInspections: 210, completionRate: 95, avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=6366f1&color=fff' },
    { id: 'INS-1025', name: 'Sarah Smith', email: 'sarah.s@fems.com', phone: '+250 788 000 002', base: 'North District', status: 'Active', availability: 'Available', totalInspections: 142, completionRate: 98, avatar: 'https://ui-avatars.com/api/?name=Sarah+Smith&background=10b981&color=fff' },
    { id: 'INS-1042', name: 'Michael Brown', email: 'm.brown@fems.com', phone: '+250 788 000 003', base: 'East District', status: 'Inactive', availability: 'On Leave', totalInspections: 87, completionRate: 78, avatar: 'https://ui-avatars.com/api/?name=Michael+Brown&background=f59e0b&color=fff' },
    { id: 'INS-1088', name: 'Emily Davis', email: 'e.davis@fems.com', phone: '+250 788 000 004', base: 'South District', status: 'Active', availability: 'Busy', totalInspections: 176, completionRate: 91, avatar: 'https://ui-avatars.com/api/?name=Emily+Davis&background=e44d26&color=fff' },
  ];

  get filteredInspectors() {
    let list = this.inspectors;
    if (this.statusFilter !== 'all') {
      list = list.filter((i) => i.status === this.statusFilter);
    }
    const t = this.searchTerm.trim().toLowerCase();
    if (!t) return list;
    return list.filter(
      (i) =>
        i.name.toLowerCase().includes(t) ||
        i.id.toLowerCase().includes(t) ||
        i.email.toLowerCase().includes(t)
    );
  }

  get totalActive() {
    return this.inspectors.filter((i) => i.status === 'Active').length;
  }

  get totalAvailable() {
    return this.inspectors.filter((i) => i.availability === 'Available').length;
  }

  selectInspector(inspector: AdminInspector) {
    this.selectedInspector = inspector;
    this.refreshIcons();
  }

  closePanel() {
    this.selectedInspector = null;
  }

  setFilter(filter: 'all' | 'Active' | 'Inactive') {
    this.statusFilter = filter;
    this.refreshIcons();
  }

  getStatusClass(status: string) {
    return status === 'Active' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200/60' : 'bg-slate-50 text-slate-600 ring-slate-200/60';
  }

  getAvailClass(av: string) {
    if (av === 'Available') return 'bg-blue-50 text-blue-700';
    if (av === 'Busy') return 'bg-amber-50 text-amber-700';
    return 'bg-red-50 text-red-600';
  }

  ngAfterViewInit() {
    this.refreshIcons();
  }

  private refreshIcons() {
    setTimeout(() => lucide?.createIcons?.(), 0);
    setTimeout(() => lucide?.createIcons?.(), 120);
  }
}
