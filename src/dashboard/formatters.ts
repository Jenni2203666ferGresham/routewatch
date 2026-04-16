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

/**
 * Formats a latency value in milliseconds to a human-readable string.
 * Values under 1ms are shown as '<1ms', under 1s as rounded milliseconds,
 * and 1s or above as seconds with two decimal places.
 */
export function formatLatency(ms: number): string {
  if (ms < 1) return '<1ms';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Formats an error rate as a percentage string with two decimal places.
 * Returns '0.00%' when there are no hits to avoid division by zero.
 */
export function formatErrorRate(errors: number, hits: number): string {
  if (hits === 0) return '0.00%';
  return `${((errors / hits) * 100).toFixed(2)}%`;
}

/**
 * Formats a route key (e.g. "GET /users") and its stats into a FormattedRow
 * suitable for display in the dashboard table.
 */
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

/**
 * Renders an array of FormattedRows as a plain-text table string.
 * Columns are padded to align values and separated by ' | '.
 * Returns an empty string when there are no rows to display.
 */
export function formatTable(rows: FormattedRow[]): string {
  if (rows.length === 0) return '';

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
