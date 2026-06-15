import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

declare const lucide: { createIcons: () => void } | undefined;

export type AlertUrgency = 'URGENT' | 'HIGH' | 'MEDIUM';

export interface ComplianceAlert {
  id: string;
  extinguisherId: string;
  type: string;
  capacity: string;
  location: string;
  urgency: AlertUrgency;
  description: string;
  timestamp: string;
  urgencyDetail: string;
  isRead: boolean;
}

@Component({
  selector: 'app-admin-compliance',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-compliance.html',
  styleUrl: './admin-compliance.css',
})
export class AdminCompliance implements AfterViewInit {
  searchTerm = '';
  urgencyFilter: 'all' | AlertUrgency = 'all';

  alerts: ComplianceAlert[] = [
    { id: '1', extinguisherId: 'EXT-00142', type: 'CO₂', capacity: '5kg', location: 'Tech Corp HQ — Server Room B', urgency: 'URGENT', description: 'Certification period exceeded by 45 days. Immediate replacement or recertification required.', timestamp: '2024-10-28', urgencyDetail: 'Expired 45 days ago', isRead: false },
    { id: '2', extinguisherId: 'EXT-00892', type: 'Dry Powder', capacity: '9kg', location: 'Westside Warehouse — Loading Dock 4', urgency: 'HIGH', description: 'Annual safety inspection overdue by 12 days.', timestamp: '2024-10-27', urgencyDetail: '12 days overdue', isRead: false },
    { id: '3', extinguisherId: 'EXT-00556', type: 'Foam', capacity: '6L', location: 'City Mall — Food Court', urgency: 'MEDIUM', description: 'Pressure gauge indicates low pressure. Refill scheduled.', timestamp: '2024-10-26', urgencyDetail: 'Scheduled Nov 2', isRead: true },
    { id: '4', extinguisherId: 'EXT-00221', type: 'CO₂', capacity: '2kg', location: 'Downtown Plaza — Sector 4', urgency: 'HIGH', description: 'Pending inspection and partial pressure loss detected.', timestamp: '2024-10-25', urgencyDetail: 'Multiple issues', isRead: false },
  ];

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
        a.location.toLowerCase().includes(q)
    );
  }

  get urgentCount() {
    return this.alerts.filter((a) => a.urgency === 'URGENT').length;
  }

  get highCount() {
    return this.alerts.filter((a) => a.urgency === 'HIGH').length;
  }

  get unreadCount() {
    return this.alerts.filter((a) => !a.isRead).length;
  }

  setUrgencyFilter(filter: 'all' | AlertUrgency) {
    this.urgencyFilter = filter;
    this.refreshIcons();
  }

  urgencyClass(u: AlertUrgency): string {
    return {
      URGENT: 'border-l-red-500 bg-red-50/30',
      HIGH: 'border-l-amber-500 bg-amber-50/20',
      MEDIUM: 'border-l-blue-500',
    }[u];
  }

  urgencyBadge(u: AlertUrgency): string {
    return {
      URGENT: 'bg-red-100 text-red-700',
      HIGH: 'bg-amber-100 text-amber-700',
      MEDIUM: 'bg-blue-100 text-blue-700',
    }[u];
  }

  ngAfterViewInit() {
    this.refreshIcons();
  }

  private refreshIcons() {
    setTimeout(() => lucide?.createIcons?.(), 0);
    setTimeout(() => lucide?.createIcons?.(), 120);
  }
}
