import { RouteMetric } from '../metrics/RouteMetrics';
import { MetricsStore } from '../metrics/MetricsStore';
import { createDedupeTracker, DedupeTracker } from './dedupeTracker';

export interface DedupeMiddleware {
  recordIfNew(metric: RouteMetric, store: MetricsStore): boolean;
  getTracker(): DedupeTracker;
  getStats(): { total: number; duplicates: number; unique: number };
  reset(): void;
}

export function createDedupeMiddleware(): DedupeMiddleware {
  const tracker = createDedupeTracker();
  let total = 0;
  let duplicates = 0;

  function recordIfNew(metric: RouteMetric, store: MetricsStore): boolean {
    total += 1;
    const before = tracker.getEntry(metric.route, metric.method, metric.statusCode);
    tracker.record(metric.route, metric.method, metric.statusCode);
    if (before && before.count >= 1) {
      duplicates += 1;
      return false;
    }
    store.record(metric);
    return true;
  }

  function getTracker(): DedupeTracker {
    return tracker;
  }

  function getStats() {
    return { total, duplicates, unique: total - duplicates };
  }

  function reset(): void {
    tracker.reset();
    total = 0;
    duplicates = 0;
  }

  return { recordIfNew, getTracker, getStats, reset };
}
