import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-chart-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="client-card chart-card p-6">
      <div class="chart-card-header" *ngIf="title">
        <div>
          <h2 class="text-lg font-semibold text-[#0B1437]">{{ title }}</h2>
          <p class="text-sm text-slate-500 mt-0.5" *ngIf="subtitle">{{ subtitle }}</p>
        </div>
        <a *ngIf="link" [routerLink]="link" [queryParams]="linkQuery"
          class="text-sm font-semibold text-[#0B1437] hover:text-teal-700 inline-flex items-center gap-1 shrink-0">
          {{ linkLabel || 'View' }}
          <i data-lucide="arrow-right" class="w-4 h-4"></i>
        </a>
      </div>
      <ng-content />
    </section>
  `,
})
export class ChartCardComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() link = '';
  @Input() linkLabel = '';
  @Input() linkQuery: Record<string, string> | null = null;
}
