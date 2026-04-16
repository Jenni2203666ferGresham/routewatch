import { RouteMetrics } from '../metrics/RouteMetrics';
import { MetricsStore } from '../metrics/MetricsStore';
import { createRouteFilter, RouteFilterConfig } from './routeFilter';

export interface FilterMiddlewareOptions {
  store: MetricsStore;
  filterConfig: RouteFilterConfig;
}

/**
 * Wraps a record call with route filtering logic.
 * Only records metrics for routes that pass the filter.
 */
export function createFilterMiddleware(options: FilterMiddlewareOptions) {
  const { store, filterConfig } = options;
  const filter = createRouteFilter(filterConfig);

  return function recordIfAllowed(metric: RouteMetrics): boolean {
    if (!filter(metric.route)) {
      return false;
    }
    store.record(metric);
    return true;
  };
}

/**
 * Returns stats about how many routes were filtered vs recorded.
 */
export function createFilterMiddlewareWithStats(options: FilterMiddlewareOptions) {
  const { store, filterConfig } = options;
  const filter = createRouteFilter(filterConfig);

  let recorded = 0;
  let filtered = 0;

  function recordIfAllowed(metric: RouteMetrics): boolean {
    if (!filter(metric.route)) {
      filtered++;
      return false;
    }
    store.record(metric);
    recorded++;
    return true;
  }

  function getStats() {
    return { recorded, filtered, total: recorded + filtered };
  }

  /** Resets recorded and filtered counters back to zero. */
  function resetStats() {
    recorded = 0;
    filtered = 0;
  }

  return { recordIfAllowed, getStats, resetStats };
}
