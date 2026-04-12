import { RouteStats } from '../metrics/RouteMetrics';

export interface FormattedRow {
  method: string;
  path: string;
  hits: string;
  avgLatency: string;
  minLatency: string;
  maxLatency: string;
  errorRate: string;
}

export function formatLatency(ms: number): string {
  if (ms < 1) return '<1ms';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function formatErrorRate(errors: number, hits: number): string {
  if (hits === 0) return '0.00%';
  return `${((errors / hits) * 100).toFixed(2)}%`;
}

export function formatRow(route: string, stats: RouteStats): FormattedRow {
  const [method, path] = route.split(' ');
  return {
    method: method ?? '-',
    path: path ?? route,
    hits: String(stats.hits),
    avgLatency: formatLatency(stats.avgLatency),
    minLatency: formatLatency(stats.minLatency),
    maxLatency: formatLatency(stats.maxLatency),
    errorRate: formatErrorRate(stats.errors, stats.hits),
  };
}

export function formatTable(rows: FormattedRow[]): string {
  const headers = ['METHOD', 'PATH', 'HITS', 'AVG', 'MIN', 'MAX', 'ERR%'];
  const cols: (keyof FormattedRow)[] = [
    'method', 'path', 'hits', 'avgLatency', 'minLatency', 'maxLatency', 'errorRate',
  ];

  const widths = headers.map((h, i) => {
    const colKey = cols[i];
    const maxData = rows.reduce((m, r) => Math.max(m, r[colKey].length), 0);
    return Math.max(h.length, maxData);
  });

  const sep = widths.map(w => '-'.repeat(w)).join('-+-');
  const header = headers.map((h, i) => h.padEnd(widths[i])).join(' | ');

  const body = rows
    .map(r => cols.map((k, i) => r[k].padEnd(widths[i])).join(' | '))
    .join('\n');

  return [header, sep, body].join('\n');
}
