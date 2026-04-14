import { RouteMetrics } from '../metrics/RouteMetrics';
import { aggregateMetrics } from '../metrics/MetricsAggregator';
import { MetricsStore } from '../metrics/MetricsStore';
import { formatLatency, formatErrorRate, formatRow, formatTable } from './formatters';
import { buildSparklineMap } from './sparkline';
import { SparklineHistory } from './sparklineHistory';

export interface TableRendererOptions {
  showSparklines?: boolean;
  maxRows?: number;
  sortBy?: 'latency' | 'errors' | 'count' | 'route';
}

export interface RenderedRow {
  route: string;
  method: string;
  count: number;
  avgLatency: string;
  p99Latency: string;
  errorRate: string;
  sparkline?: string;
}

export function renderTableRows(
  store: MetricsStore,
  history: SparklineHistory,
  options: TableRendererOptions = {}
): RenderedRow[] {
  const { showSparklines = true, maxRows = 20, sortBy = 'latency' } = options;
  const aggregated = aggregateMetrics(store);

  const rows: RenderedRow[] = aggregated.map((entry) => {
    const sparklineMap = showSparklines ? buildSparklineMap(history.getAll()) : {};
    return {
      route: entry.route,
      method: entry.method,
      count: entry.count,
      avgLatency: formatLatency(entry.avgLatency),
      p99Latency: formatLatency(entry.p99Latency),
      errorRate: formatErrorRate(entry.errorRate),
      sparkline: showSparklines ? (sparklineMap[`${entry.method}:${entry.route}`] ?? '') : undefined,
    };
  });

  const sorted = sortRows(rows, sortBy);
  return sorted.slice(0, maxRows);
}

function sortRows(rows: RenderedRow[], sortBy: TableRendererOptions['sortBy']): RenderedRow[] {
  return [...rows].sort((a, b) => {
    switch (sortBy) {
      case 'errors':
        return parseFloat(b.errorRate) - parseFloat(a.errorRate);
      case 'count':
        return b.count - a.count;
      case 'route':
        return a.route.localeCompare(b.route);
      case 'latency':
      default:
        return parseFloat(b.avgLatency) - parseFloat(a.avgLatency);
    }
  });
}

export function renderFullTable(
  store: MetricsStore,
  history: SparklineHistory,
  options: TableRendererOptions = {}
): string {
  const rows = renderTableRows(store, history, options);
  const headers = ['Route', 'Method', 'Count', 'Avg Latency', 'P99 Latency', 'Error Rate'];
  if (options.showSparklines !== false) headers.push('Trend');

  const tableRows = rows.map((r) => {
    const cols = [r.route, r.method, String(r.count), r.avgLatency, r.p99Latency, r.errorRate];
    if (options.showSparklines !== false) cols.push(r.sparkline ?? '');
    return formatRow(cols);
  });

  return formatTable(headers, tableRows);
}
