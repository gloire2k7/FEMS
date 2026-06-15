export interface ChartSegment {
  label: string;
  value: number;
  color?: string;
}

export const CHART_COLORS = [
  '#0B1437',
  '#3b82f6',
  '#8b5cf6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#06b6d4',
  '#ec4899',
];

export const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  granted: '#10b981',
  approved: '#10b981',
  delivered: '#0ea5e9',
  cancelled: '#ef4444',
  denied: '#ef4444',
  filled: '#10b981',
  empty: '#94a3b8',
};

export function chartColor(label: string, index: number): string {
  const key = label.toLowerCase();
  return STATUS_COLORS[key] ?? CHART_COLORS[index % CHART_COLORS.length];
}

export function withColors(segments: ChartSegment[]): ChartSegment[] {
  return segments.map((s, i) => ({
    ...s,
    color: s.color ?? chartColor(s.label, i),
  }));
}

export function maxValue(segments: ChartSegment[]): number {
  return Math.max(...segments.map(s => s.value), 1);
}

export function totalValue(segments: ChartSegment[]): number {
  return segments.reduce((sum, s) => sum + s.value, 0);
}

export function formatChartLabel(label: string): string {
  return label.charAt(0).toUpperCase() + label.slice(1).replace(/_/g, ' ');
}

export function toChartSegments(
  rows: { status?: string; type?: string; capacity?: string; count: number }[] | undefined,
  labelFn?: (row: { status?: string; type?: string; capacity?: string }) => string
): ChartSegment[] {
  if (!rows?.length) return [];
  return rows
    .map(r => ({
      label: labelFn ? labelFn(r) : (r.status ?? r.type ?? 'Other'),
      value: Number(r.count) || 0,
    }))
    .filter(s => s.value > 0);
}

export function stockLabel(row: { type?: string; capacity?: string }): string {
  return row.capacity ? `${row.type} · ${row.capacity}` : (row.type ?? 'Other');
}
