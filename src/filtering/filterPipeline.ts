import { RouteMetric } from '../metrics/RouteMetrics';
import { MetricsStore } from '../metrics/MetricsStore';
import { createRouteFilter } from './routeFilter';
import { buildFilterConfig, FilterConfigInput } from './filterConfig';
import { validateRouteFilterConfig } from './routeFilter';

export interface FilterPipelineOptions {
  include?: string[];
  exclude?: string[];
  methods?: string[];
}

export interface FilterPipeline {
  process(metric: RouteMetric): boolean;
  processAndRecord(metric: RouteMetric, store: MetricsStore): void;
  getStats(): { processed: number; allowed: number; rejected: number };
  reset(): void;
}

export function createFilterPipeline(
  options: FilterPipelineOptions = {}
): FilterPipeline {
  const config = buildFilterConfig(options);
  const validationErrors = validateRouteFilterConfig(config);
  if (validationErrors.length > 0) {
    throw new Error(`Invalid filter config: ${validationErrors.join(', ')}`);
  }

  const filter = createRouteFilter(config);

  let processed = 0;
  let allowed = 0;
  let rejected = 0;

  /**
   * Normalises the HTTP method to uppercase before checking against the
   * configured method allowlist.  Returns true when no method filter is set.
   */
  function isMethodAllowed(method: string): boolean {
    if (!config.methods || config.methods.length === 0) {
      return true;
    }
    return config.methods.includes(method.toUpperCase());
  }

  function process(metric: RouteMetric): boolean {
    processed++;
    const pass = isMethodAllowed(metric.method) && filter(metric.route);

    if (pass) {
      allowed++;
    } else {
      rejected++;
    }
    return pass;
  }

  function processAndRecord(metric: RouteMetric, store: MetricsStore): void {
    if (process(metric)) {
      store.record(metric);
    }
  }

  function getStats() {
    return { processed, allowed, rejected };
  }

  function reset() {
    processed = 0;
    allowed = 0;
    rejected = 0;
  }

  return { process, processAndRecord, getStats, reset };
}
