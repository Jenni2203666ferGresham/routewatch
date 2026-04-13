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

  function process(metric: RouteMetric): boolean {
    processed++;
    const methodAllowed =
      !config.methods || config.methods.length === 0
        ? true
        : config.methods.includes(metric.method.toUpperCase());

    const routeAllowed = filter(metric.route);
    const pass = methodAllowed && routeAllowed;

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
