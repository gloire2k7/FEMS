import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartSegment, formatChartLabel, totalValue, withColors } from './chart.models';

@Component({
  selector: 'app-donut-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-donut-wrap">
      <div *ngIf="!segments.length" class="chart-empty py-8">No data yet</div>
      <ng-container *ngIf="segments.length">
        <div class="chart-donut-visual">
          <svg viewBox="0 0 100 100" class="chart-donut-svg">
            <circle cx="50" cy="50" r="38" fill="none" stroke="#f1f5f9" stroke-width="12" />
            <circle *ngFor="let arc of arcs" cx="50" cy="50" r="38" fill="none"
              stroke-width="12" stroke-linecap="round"
              [attr.stroke]="arc.color"
              [attr.stroke-dasharray]="arc.dash"
              [attr.stroke-dashoffset]="arc.offset"
              class="chart-donut-segment" />
          </svg>
          <div class="chart-donut-center">
            <span class="chart-donut-total">{{ total }}</span>
            <span class="chart-donut-sub">{{ centerLabel }}</span>
          </div>
        </div>
        <ul class="chart-donut-legend">
          <li *ngFor="let seg of colored">
            <span class="chart-legend-dot" [style.background]="seg.color"></span>
            <span class="chart-legend-label">{{ formatLabel(seg.label) }}</span>
            <span class="chart-legend-value">{{ seg.value }}</span>
          </li>
        </ul>
      </ng-container>
    </div>
  `,
})
export class DonutChartComponent {
  @Input() segments: ChartSegment[] = [];
  @Input() centerLabel = 'Total';

  get colored() {
    return withColors(this.segments);
  }

  get total() {
    return totalValue(this.segments);
  }

  formatLabel = formatChartLabel;

  get arcs() {
    const circumference = 2 * Math.PI * 38;
    const total = this.total || 1;
    let offset = 0;
    return this.colored.map(seg => {
      const pct = seg.value / total;
      const dash = `${pct * circumference} ${circumference}`;
      const arc = { color: seg.color!, dash, offset: -offset };
      offset += pct * circumference;
      return arc;
    });
  }
}
