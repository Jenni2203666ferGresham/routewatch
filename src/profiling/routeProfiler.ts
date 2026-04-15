import { MetricsStore } from '../metrics/MetricsStore';
import { aggregateMetrics, percentile } from '../metrics/MetricsAggregator';

export interface RouteProfile {
  route: string;
  method: string;
  callCount: number;
  avgLatency: number;
  p50: number;
  p95: number;
  p99: number;
  errorRate: number;
  firstSeen: number;
  lastSeen: number;
}

export interface ProfilerOptions {
  minCallCount?: number;
  sortBy?: 'avgLatency' | 'p95' | 'p99' | 'callCount' | 'errorRate';
  limit?: number;
}

const DEFAULT_OPTIONS: Required<ProfilerOptions> = {
  minCallCount: 1,
  sortBy: 'p95',
  limit: 50,
};

export function profileRoutes(
  store: MetricsStore,
  options: ProfilerOptions = {}
): RouteProfile[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const aggregated = aggregateMetrics(store);

  const profiles: RouteProfile[] = Object.entries(aggregated)
    .filter(([, agg]) => agg.count >= opts.minCallCount)
    .map(([key, agg]) => {
      const [method, route] = key.split(' ', 2);
      const latencies = agg.latencies ?? [];
      return {
        route,
        method,
        callCount: agg.count,
        avgLatency: agg.avgLatency,
        p50: percentile(latencies, 50),
        p95: percentile(latencies, 95),
        p99: percentile(latencies, 99),
        errorRate: agg.errorRate,
        firstSeen: agg.firstSeen,
        lastSeen: agg.lastSeen,
      };
    });

  profiles.sort((a, b) => b[opts.sortBy] - a[opts.sortBy]);

  return profiles.slice(0, opts.limit);
}

export function summarizeProfile(profiles: RouteProfile[]): string {
  if (profiles.length === 0) return 'No route profiles available.';
  const lines = [
    `Route Profile Summary (${profiles.length} routes):`,
    '',
    ...profiles.map(
      (p) =>
        `  ${p.method.padEnd(7)} ${p.route.padEnd(40)} ` +
        `calls=${p.callCount} avg=${p.avgLatency.toFixed(1)}ms ` +
        `p95=${p.p95.toFixed(1)}ms p99=${p.p99.toFixed(1)}ms ` +
        `err=${(p.errorRate * 100).toFixed(1)}%`
    ),
  ];
  return lines.join('\n');
}
