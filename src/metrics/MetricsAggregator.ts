import { MetricsStore } from './MetricsStore';
import { RouteMetrics } from './RouteMetrics';

export interface AggregatedStats {
  route: string;
  method: string;
  totalRequests: number;
  avgLatency: number;
  p95Latency: number;
  p99Latency: number;
  errorRate: number;
  requestsPerMinute: number;
}

export function percentile(sortedValues: number[], p: number): number {
  if (sortedValues.length === 0) return 0;
  const index = Math.ceil((p / 100) * sortedValues.length) - 1;
  return sortedValues[Math.max(0, index)];
}

export function aggregateMetrics(store: MetricsStore): AggregatedStats[] {
  const allMetrics = store.getAll();
  const results: AggregatedStats[] = [];

  for (const metrics of allMetrics) {
    const sorted = [...metrics.latencies].sort((a, b) => a - b);
    const total = metrics.latencies.length;
    const avg = total > 0 ? metrics.latencies.reduce((s, v) => s + v, 0) / total : 0;
    const p95 = percentile(sorted, 95);
    const p99 = percentile(sorted, 99);
    const errorRate = total > 0 ? metrics.errorCount / total : 0;

    const windowMs = Date.now() - metrics.windowStart;
    const windowMinutes = Math.max(windowMs / 60000, 1 / 60);
    const requestsPerMinute = total / windowMinutes;

    results.push({
      route: metrics.route,
      method: metrics.method,
      totalRequests: total,
      avgLatency: Math.round(avg * 100) / 100,
      p95Latency: p95,
      p99Latency: p99,
      errorRate: Math.round(errorRate * 10000) / 10000,
      requestsPerMinute: Math.round(requestsPerMinute * 100) / 100,
    });
  }

  return results.sort((a, b) => b.totalRequests - a.totalRequests);
}

export function getSlowestRoutes(store: MetricsStore, topN = 5): AggregatedStats[] {
  return aggregateMetrics(store)
    .sort((a, b) => b.avgLatency - a.avgLatency)
    .slice(0, topN);
}

export function getHighestErrorRoutes(store: MetricsStore, topN = 5): AggregatedStats[] {
  return aggregateMetrics(store)
    .sort((a, b) => b.errorRate - a.errorRate)
    .slice(0, topN);
}

/**
 * Returns the routes with the highest requests-per-minute, useful for
 * identifying hotspots and potential bottlenecks under load.
 */
export function getHighestThroughputRoutes(store: MetricsStore, topN = 5): AggregatedStats[] {
  return aggregateMetrics(store)
    .sort((a, b) => b.requestsPerMinute - a.requestsPerMinute)
    .slice(0, topN);
}
