import { AfterViewInit, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { InspectionService } from '../../services/inspection.service';

declare const lucide: { createIcons: () => void } | undefined;

@Component({
  selector: 'app-inspector-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="max-w-5xl">
      <h1 class="text-2xl font-bold text-[#0B1437] mb-2">Dashboard</h1>
      <p class="text-slate-500 mb-8">Overview of your inspection workload.</p>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <a routerLink="/inspector-inspections" class="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition-shadow no-underline">
          <p class="text-sm font-medium text-slate-500">Available</p>
          <p class="text-3xl font-bold text-[#0B1437] mt-1">{{ stats.pool }}</p>
          <p class="text-sm text-emerald-600 mt-2">Open inspections →</p>
        </a>
        <a routerLink="/inspector-my-inspections" class="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition-shadow no-underline">
          <p class="text-sm font-medium text-slate-500">Assigned to me</p>
          <p class="text-3xl font-bold text-[#0B1437] mt-1">{{ stats.assigned }}</p>
          <p class="text-sm text-blue-600 mt-2">View my list →</p>
        </a>
        <div class="bg-white rounded-2xl border border-slate-200 p-6">
          <p class="text-sm font-medium text-slate-500">Completed</p>
          <p class="text-3xl font-bold text-[#0B1437] mt-1">{{ stats.completed }}</p>
          <p class="text-sm text-slate-400 mt-2">Total finished</p>
        </div>
      </div>
    </div>
  `
})
export class InspectorDashboardComponent implements OnInit, AfterViewInit {
  private inspectionService = inject(InspectionService);
  stats = { pool: 0, assigned: 0, completed: 0 };

  ngOnInit() {
    this.inspectionService.getStats().subscribe({
      next: (s) => this.stats = s,
      error: () => {}
    });
  }

  ngAfterViewInit() {
    setTimeout(() => lucide?.createIcons?.(), 50);
  }
}
