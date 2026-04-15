/**
 * Profiling middleware that integrates route profiling into the request lifecycle.
 * Captures per-request timing and attaches profiling context to metrics.
 */

import { RouteMetric } from '../metrics/RouteMetrics';
import { MetricsStore } from '../metrics/MetricsStore';
import { profileRoutes, summarizeProfile } from './routeProfiler';

export interface ProfilingMiddlewareOptions {
  /** Number of top slow routes to highlight */
  topN?: number;
  /** Minimum sample count before a route is included in profiling */
  minSamples?: number;
  /** Whether to log profiling summaries to stderr */
  logSummary?: boolean;
  /** Interval in ms at which to emit profiling summaries (0 = disabled) */
  summaryIntervalMs?: number;
}

export interface ProfilingStats {
  totalProfiled: number;
  lastSummaryAt: number | null;
  topSlowRoutes: string[];
}

const DEFAULT_OPTIONS: Required<ProfilingMiddlewareOptions> = {
  topN: 5,
  minSamples: 3,
  logSummary: false,
  summaryIntervalMs: 0,
};

/**
 * Creates a profiling middleware function that wraps metric recording
 * with route profiling analysis.
 */
export function createProfilingMiddleware(
  store: MetricsStore,
  options: ProfilingMiddlewareOptions = {}
) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let totalProfiled = 0;
  let lastSummaryAt: number | null = null;
  let summaryTimer: ReturnType<typeof setInterval> | null = null;

  if (opts.summaryIntervalMs > 0 && opts.logSummary) {
    summaryTimer = setInterval(() => {
      emitSummary();
    }, opts.summaryIntervalMs);
    // Allow the process to exit naturally
    if (summaryTimer.unref) summaryTimer.unref();
  }

  function emitSummary(): void {
    const profile = profileRoutes(store, { topN: opts.topN, minSamples: opts.minSamples });
    const summary = summarizeProfile(profile);
    process.stderr.write(`[routewatch:profiling] ${summary}\n`);
    lastSummaryAt = Date.now();
  }

  /**
   * Records a metric into the store and increments the profiling counter.
   */
  function record(metric: RouteMetric): void {
    store.record(metric);
    totalProfiled += 1;
  }

  /**
   * Returns a snapshot of current profiling stats including slow route names.
   */
  function getStats(): ProfilingStats {
    const profile = profileRoutes(store, { topN: opts.topN, minSamples: opts.minSamples });
    const topSlowRoutes = profile.slowestRoutes.map(
      (r) => `${r.method} ${r.route}`
    );
    return {
      totalProfiled,
      lastSummaryAt,
      topSlowRoutes,
    };
  }

  /**
   * Stops the periodic summary timer if running.
   */
  function stop(): void {
    if (summaryTimer !== null) {
      clearInterval(summaryTimer);
      summaryTimer = null;
    }
  }

  return { record, getStats, stop };
}
