import { RouteMetrics } from '../metrics/RouteMetrics';
import { formatRow, formatTable, FormattedRow } from './formatters';

export interface RenderOptions {
  clearScreen?: boolean;
  sortBy?: 'hits' | 'avgLatency' | 'errorRate';
  title?: string;
}

const DEFAULT_OPTIONS: RenderOptions = {
  clearScreen: true,
  sortBy: 'hits',
  title: 'RouteWatch — Live Route Metrics',
};

export function renderDashboard(
  metrics: RouteMetrics,
  options: RenderOptions = {},
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const snapshot = metrics.getSnapshot();
  const routes = Object.keys(snapshot);

  const rows: FormattedRow[] = routes.map(route => formatRow(route, snapshot[route]));

  if (opts.sortBy === 'hits') {
    rows.sort((a, b) => Number(b.hits) - Number(a.hits));
  } else if (opts.sortBy === 'avgLatency') {
    rows.sort((a, b) => parseFloat(b.avgLatency) - parseFloat(a.avgLatency));
  } else if (opts.sortBy === 'errorRate') {
    rows.sort((a, b) => parseFloat(b.errorRate) - parseFloat(a.errorRate));
  }

  const timestamp = new Date().toISOString();
  const header = `${opts.title}\nUpdated: ${timestamp}\n`;
  const table = rows.length > 0 ? formatTable(rows) : '  No routes recorded yet.';

  const output = [header, table].join('\n');

  if (opts.clearScreen && process.stdout.isTTY) {
    process.stdout.write('\x1Bc');
  }

  return output;
}

export function startLiveRender(
  metrics: RouteMetrics,
  intervalMs = 1000,
  options: RenderOptions = {},
): NodeJS.Timeout {
  return setInterval(() => {
    const output options);
    process.stdout.write(output + '\n');
  }, intervalMs);
}
