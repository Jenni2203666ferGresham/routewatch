import { MetricsStore } from '../metrics/MetricsStore';

export interface RouteUsageEntry {
  route: string;
  method: string;
  totalRequests: number;
  avgLatencyMs: number;
  errorRate: number;
  score: number;
}

export interface UsageRankOptions {
  topN?: number;
  minRequests?: number;
  sortBy?: 'score' | 'requests' | 'latency' | 'errorRate';
}

function computeScore(entry: Omit<RouteUsageEntry, 'score'>): number {
  // Higher requests → higher score; penalize high latency and error rate
  const requestWeight = Math.log1p(entry.totalRequests) * 10;
  const latencyPenalty = Math.log1p(entry.avgLatencyMs) * 2;
  const errorPenalty = entry.errorRate * 50;
  return Math.max(0, requestWeight - latencyPenalty - errorPenalty);
}

export function rankRoutesByUsage(
  store: MetricsStore,
  options: UsageRankOptions = {}
): RouteUsageEntry[] {
  const { topN, minRequests = 1, sortBy = 'score' } = options;
  const all = store.getAll();

  const entries: RouteUsageEntry[] = [];

  for (const [key, metric] of Object.entries(all)) {
    const totalRequests = metric.count ?? 0;
    if (totalRequests < minRequests) continue;

    const avgLatencyMs =
      totalRequests > 0 ? (metric.totalDuration ?? 0) / totalRequests : 0;
    const errorRate =
      totalRequests > 0 ? (metric.errorCount ?? 0) / totalRequests : 0;

    const base = {
      route: metric.route,
      method: metric.method,
      totalRequests,
      avgLatencyMs,
      errorRate,
    };

    entries.push({ ...base, score: computeScore(base) });
  }

  const sorted = entries.sort((a, b) => {
    switch (sortBy) {
      case 'requests':
        return b.totalRequests - a.totalRequests;
      case 'latency':
        return b.avgLatencyMs - a.avgLatencyMs;
      case 'errorRate':
        return b.errorRate - a.errorRate;
      case 'score':
      default:
        return b.score - a.score;
    }
  });

  return topN !== undefined ? sorted.slice(0, topN) : sorted;
}

export function createRouteUsageRanker(store: MetricsStore) {
  return {
    rank(options?: UsageRankOptions): RouteUsageEntry[] {
      return rankRoutesByUsage(store, options);
    },
    top(n: number, sortBy?: UsageRankOptions['sortBy']): RouteUsageEntry[] {
      return rankRoutesByUsage(store, { topN: n, sortBy });
    },
  };
}
