import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartSegment, formatChartLabel, maxValue, withColors } from './chart.models';

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-bars" [style.height.px]="height">
      <div *ngIf="!segments.length" class="chart-empty">No data yet</div>
      <div *ngFor="let seg of colored" class="chart-bar-col">
        <span class="chart-bar-value">{{ seg.value }}</span>
        <div class="chart-bar-track">
          <div class="chart-bar-fill rounded-lg"
            [style.height.%]="barHeight(seg.value)"
            [style.background]="seg.color"></div>
        </div>
        <span class="chart-bar-label">{{ formatLabel(seg.label) }}</span>
      </div>
    </div>
  `,
})
export class BarChartComponent {
  @Input() segments: ChartSegment[] = [];
  @Input() height = 160;

  get colored() {
    return withColors(this.segments);
  }

  formatLabel = formatChartLabel;

  barHeight(value: number): number {
    return Math.max(6, (value / maxValue(this.segments)) * 100);
  }
}
