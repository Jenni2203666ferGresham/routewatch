import { RouteMetrics } from '../metrics/RouteMetrics';
import { MetricsStore } from '../metrics/MetricsStore';
import { createSampler } from './sampler';
import { buildSamplingConfig, SamplingConfig } from './samplingConfig';

export interface SamplingMiddlewareOptions {
  store: MetricsStore;
  config?: Partial<SamplingConfig>;
}

/**
 * Wraps an existing metrics recording call with sampling logic.
 * Only records a metric if the sampler allows it for the given route.
 */
export function createSamplingMiddleware(options: SamplingMiddlewareOptions) {
  const config = buildSamplingConfig(options.config ?? {});
  const sampler = createSampler(config);

  return function recordIfSampled(metric: RouteMetrics): boolean {
    const route = `${metric.method}:${metric.path}`;

    if (!sampler.shouldSample(route)) {
      return false;
    }

    options.store.record(metric);
    return true;
  };
}

/**
 * Returns per-route sample counts from the sampler for diagnostics.
 */
export function createSamplingMiddlewareWithStats(options: SamplingMiddlewareOptions) {
  const config = buildSamplingConfig(options.config ?? {});
  const sampler = createSampler(config);
  const counts: Record<string, { seen: number; recorded: number }> = {};

  function recordIfSampled(metric: RouteMetrics): boolean {
    const route = `${metric.method}:${metric.path}`;

    if (!counts[route]) {
      counts[route] = { seen: 0, recorded: 0 };
    }
    counts[route].seen++;

    if (!sampler.shouldSample(route)) {
      return false;
    }

    counts[route].recorded++;
    options.store.record(metric);
    return true;
  }

  function getStats() {
    return { ...counts };
  }

  return { recordIfSampled, getStats };
}
