import { Component, AfterViewInit, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ActivityLogService, ActivityLogEntry, EntityBreakdown } from '../../services/activity-log.service';
import { PaginationComponent } from '../../shared/pagination/pagination.component';

declare const lucide: { createIcons: () => void } | undefined;

interface MetricCard {
  label: string;
  value: string;
  hint: string;
  icon: string;
  featured: boolean;
}

interface HeatmapItem {
  label: string;
  value: string;
  percent: number;
  color: string;
}

@Component({
  selector: 'app-super-admin-logs',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PaginationComponent],
  templateUrl: './super-admin-logs.html',
  styleUrls: ['./super-admin-logs.css'],
})
export class SuperAdminLogs implements OnInit, AfterViewInit {
  private activityLogs = inject(ActivityLogService);
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  searchQuery = '';
  entityFilter = 'all';
  loading = false;
  exporting = false;

  readonly entityFilters = [
    { key: 'all', label: 'All' },
    { key: 'order', label: 'Orders' },
    { key: 'extinguisher', label: 'Extinguishers' },
    { key: 'client', label: 'Clients' },
    { key: 'user', label: 'Users' },
    { key: 'report', label: 'Reports' },
  ];

  metrics: MetricCard[] = [];
  heatmap: HeatmapItem[] = [];
  logs: ActivityLogEntry[] = [];
  total = 0;
  page = 1;
  lastPage = 1;

  private readonly heatmapColors = [
    'bg-violet-500', 'bg-violet-400', 'bg-emerald-500', 'bg-amber-500', 'bg-orange-500',
    'bg-indigo-500', 'bg-blue-500', 'bg-teal-500',
  ];

  ngOnInit() {
    this.load(1);
  }

  ngAfterViewInit() {
    this.refreshIcons();
  }

  load(page = 1) {
    this.loading = true;
    this.page = page;
    this.activityLogs.list(page, this.entityFilter, this.searchQuery).subscribe({
      next: (res) => {
        this.logs = res.data ?? [];
        this.total = res.total ?? 0;
        this.lastPage = res.last_page ?? 1;
        this.buildMetrics(res.stats);
        this.buildHeatmap(res.entity_breakdown ?? []);
        this.loading = false;
        this.refreshIcons();
      },
      error: () => {
        this.logs = [];
        this.loading = false;
      },
    });
  }

  onSearchChange() {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.load(1), 350);
  }

  setEntityFilter(filter: string) {
    this.entityFilter = filter;
    this.load(1);
  }

  exportCsv() {
    this.exporting = true;
    this.activityLogs.exportCsv(this.entityFilter, this.searchQuery).subscribe({
      next: (res) => {
        if (res.file_path) {
          window.open(`http://localhost:8000${res.file_path}`, '_blank');
        }
        this.exporting = false;
      },
      error: () => {
        this.exporting = false;
      },
    });
  }

  private buildMetrics(stats: { total: number; today: number; critical: number; active_users_today: number; last_activity_at: string | null }) {
    this.metrics = [
      {
        label: 'Total logs',
        value: this.formatNum(stats.total),
        hint: 'All recorded actions',
        icon: 'scroll-text',
        featured: true,
      },
      {
        label: "Today's activity",
        value: this.formatNum(stats.today),
        hint: stats.last_activity_at ? `Last action ${this.timeAgo(stats.last_activity_at)}` : 'No activity yet',
        icon: 'zap',
        featured: false,
      },
      {
        label: 'Critical actions',
        value: this.formatNum(stats.critical),
        hint: 'Deletes, denials & rejections',
        icon: 'alert-triangle',
        featured: false,
      },
      {
        label: 'Active users today',
        value: this.formatNum(stats.active_users_today),
        hint: 'Distinct users with activity',
        icon: 'users',
        featured: false,
      },
    ];
  }

  private buildHeatmap(breakdown: EntityBreakdown[]) {
    this.heatmap = breakdown.map((item, i) => ({
      label: item.label,
      value: this.formatNum(item.count),
      percent: item.percent,
      color: this.heatmapColors[i % this.heatmapColors.length],
    }));
  }

  private formatNum(n: number): string {
    return (n ?? 0).toLocaleString();
  }

  private timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr ago`;
    return `${Math.floor(hrs / 24)} day(s) ago`;
  }

  private refreshIcons() {
    setTimeout(() => lucide?.createIcons?.(), 0);
    setTimeout(() => lucide?.createIcons?.(), 120);
  }
}
