import { Component, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

declare const lucide: { createIcons: () => void } | undefined;

@Component({
  selector: 'app-super-admin-logs',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './super-admin-logs.html',
  styleUrls: ['./super-admin-logs.css'],
})
export class SuperAdminLogs implements AfterViewInit {
  searchQuery = '';
  actionFilter = 'all';

  metrics = [
    { label: 'Total logs', value: '24,847', hint: '+12.5% vs last month', icon: 'scroll-text', featured: true },
    { label: "Today's activity", value: '1,847', hint: 'Last action 2 min ago', icon: 'zap', featured: false },
    { label: 'Critical actions', value: '127', hint: '24 deletes · 103 updates', icon: 'alert-triangle', featured: false },
    { label: 'Active users', value: '89', hint: '81 online now', icon: 'users', featured: false },
  ];

  heatmap = [
    { label: 'Client', value: '12,547', percent: 85, color: 'bg-violet-500' },
    { label: 'Extinguisher', value: '8,423', percent: 65, color: 'bg-violet-400' },
    { label: 'Inspection', value: '6,234', percent: 50, color: 'bg-emerald-500' },
    { label: 'Label', value: '4,128', percent: 35, color: 'bg-amber-500' },
    { label: 'User', value: '3,211', percent: 25, color: 'bg-orange-500' },
  ];

  logs = [
    { id: 'LOG-24847', name: 'Sarah Johnson', email: 'sarah.j@fems.com', role: 'Admin', action: 'Delete', entity: 'Client', date: 'Oct 31, 2023', time: '15:22:16', actionClass: 'bg-red-50 text-red-600', roleClass: 'bg-violet-50 text-violet-600' },
    { id: 'LOG-24846', name: 'Michael Brown', email: 'm.brown@fems.com', role: 'Manager', action: 'Approve', entity: 'Inspection', date: 'Oct 31, 2023', time: '14:20:45', actionClass: 'bg-emerald-50 text-emerald-600', roleClass: 'bg-blue-50 text-blue-600' },
    { id: 'LOG-24845', name: 'John Smith', email: 'j.smith@fems.com', role: 'Inspector', action: 'Update', entity: 'Extinguisher', date: 'Oct 31, 2023', time: '14:15:22', actionClass: 'bg-amber-50 text-amber-600', roleClass: 'bg-amber-50 text-amber-600' },
    { id: 'LOG-24844', name: 'Emma Wilson', email: 'e.wilson@fems.com', role: 'Login', action: 'Login', entity: 'User', date: 'Oct 31, 2023', time: '13:58:11', actionClass: 'bg-slate-100 text-slate-600', roleClass: 'bg-slate-800 text-white' },
    { id: 'LOG-24843', name: 'David Martinez', email: 'd.martinez@fems.com', role: 'Admin', action: 'Export', entity: 'Label', date: 'Oct 31, 2023', time: '13:42:37', actionClass: 'bg-indigo-50 text-indigo-600', roleClass: 'bg-violet-50 text-violet-600' },
    { id: 'LOG-24842', name: 'Lisa Andersen', email: 'l.andersen@fems.com', role: 'Manager', action: 'Create', entity: 'Client', date: 'Oct 31, 2023', time: '13:15:59', actionClass: 'bg-emerald-50 text-emerald-600', roleClass: 'bg-blue-50 text-blue-600' },
  ];

  get filteredLogs() {
    let list = this.logs;
    if (this.actionFilter !== 'all') {
      list = list.filter(l => l.action.toLowerCase() === this.actionFilter);
    }
    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(l =>
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.id.toLowerCase().includes(q)
      );
    }
    return list;
  }

  ngAfterViewInit() {
    this.refreshIcons();
  }

  private refreshIcons() {
    setTimeout(() => lucide?.createIcons?.(), 0);
    setTimeout(() => lucide?.createIcons?.(), 120);
  }
}
