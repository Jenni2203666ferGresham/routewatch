/**
 * Route Quality Middleware
 *
 * After each request completes, computes and caches the quality score
 * for the matched route so dashboards and alerts can consume it.
 */

import { IncomingMessage, ServerResponse } from 'http';
import { MetricsStore } from '../metrics/MetricsStore';
import { aggregateMetrics } from '../metrics/MetricsAggregator';
import {
  RouteQualityResult,
  rankByQuality,
  RouteQualityInput,
} from './routeQualityScore';

export interface QualityMiddlewareOptions {
  /** Default latency budget in ms when none is configured per-route. */
  defaultBudgetMs?: number;
  /** Per-route budget overrides keyed by "METHOD /path". */
  budgets?: Record<string, number>;
}

export interface RouteQualityCache {
  scores: Map<string, RouteQualityResult>;
  lastUpdated: number;
}

export function createRouteQualityMiddleware(
  store: MetricsStore,
  options: QualityMiddlewareOptions = {}
) {
  const { defaultBudgetMs = 500, budgets = {} } = options;
  const cache: RouteQualityCache = { scores: new Map(), lastUpdated: 0 };

  function refresh(): void {
    const aggregated = aggregateMetrics(store);
    const inputs: RouteQualityInput[] = aggregated.map((agg) => {
      const key = `${agg.method} ${agg.route}`;
      const budgetMs = budgets[key] ?? defaultBudgetMs;
      const total = agg.count;
      const errors = Math.round((agg.errorRate ?? 0) * total);
      const rpm = total; // treat count as rpm for simplicity
      return {
        route: agg.route,
        method: agg.method,
        avgLatencyMs: agg.avgLatency,
        p99LatencyMs: agg.p99 ?? agg.avgLatency,
        errorRate: agg.errorRate ?? 0,
        requestsPerMinute: rpm,
        slaBreachRate: 0, // extended integrations can supply this
        latencyBudgetMs: budgetMs,
      };
    });
    const ranked = rankByQuality(inputs);
    cache.scores.clear();
    for (const result of ranked) {
      cache.scores.set(`${result.method} ${result.route}`, result);
    }
    cache.lastUpdated = Date.now();
  }

  function middleware(
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void
  ): void {
    res.on('finish', () => {
      refresh();
    });
    next();
  }

  function getScore(method: string, route: string): RouteQualityResult | undefined {
    return cache.scores.get(`${method.toUpperCase()} ${route}`);
  }

  function getAllScores(): RouteQualityResult[] {
    return Array.from(cache.scores.values());
  }

  function reset(): void {
    cache.scores.clear();
    cache.lastUpdated = 0;
  }

  return { middleware, getScore, getAllScores, refresh, reset, cache };
}
