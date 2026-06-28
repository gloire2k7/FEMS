import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartSegment, formatChartLabel, maxValue, withColors } from './chart.models';

@Component({
  selector: 'app-h-bar-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-hbars">
      <div *ngIf="!segments.length" class="chart-empty">No data yet</div>
      <div *ngFor="let seg of colored" class="chart-hbar-row">
        <span class="chart-hbar-label">{{ formatLabel(seg.label) }}</span>
        <div class="chart-hbar-track">
          <div class="chart-hbar-fill rounded-full"
            [style.width.%]="barWidth(seg.value)"
            [style.background]="seg.color"></div>
        </div>
        <span class="chart-hbar-value">{{ seg.value }}</span>
      </div>
    </div>
  `,
})
export class HorizontalBarChartComponent {
  @Input() segments: ChartSegment[] = [];
  @Input() maxItems = 6;

  get colored() {
    return withColors(this.segments.slice(0, this.maxItems));
  }

  formatLabel = formatChartLabel;

  barWidth(value: number): number {
    return Math.max(4, (value / maxValue(this.segments)) * 100);
  }
}
