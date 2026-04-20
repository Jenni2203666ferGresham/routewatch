/**
 * routePriorityMiddleware.ts
 * Express middleware that records each request into a RoutePriorityQueue
 * using the route's current score from a RouteScorer, enabling real-time
 * priority-ranked visibility of active routes.
 */

import { Request, Response, NextFunction } from 'express';
import { createRoutePriorityQueue, RoutePriorityQueue } from './routePriorityQueue';
import { createRouteScorer } from './routeScorer';
import { MetricsStore } from '../metrics/MetricsStore';

export interface PriorityMiddlewareOptions {
  store: MetricsStore;
  /** Max entries retained in the priority queue (default: 200) */
  maxSize?: number;
}

export interface PriorityMiddlewareHandle {
  middleware: (req: Request, res: Response, next: NextFunction) => void;
  getQueue: () => RoutePriorityQueue;
  reset: () => void;
}

export function createRoutePriorityMiddleware(
  options: PriorityMiddlewareOptions
): PriorityMiddlewareHandle {
  const { store, maxSize = 200 } = options;
  const queue = createRoutePriorityQueue();
  const scorer = createRouteScorer();

  function middleware(req: Request, res: Response, next: NextFunction): void {
    const route = (req.route?.path as string) ?? req.path ?? 'unknown';
    const method = req.method ?? 'GET';

    res.on('finish', () => {
      try {
        const allMetrics = store.getAll();
        const routeMetrics = allMetrics[`${method}::${route}`];

        const score = routeMetrics
          ? scorer.score({
              route,
              method,
              avgLatency: routeMetrics.avgLatency ?? 0,
              requestCount: routeMetrics.count ?? 0,
              errorRate: routeMetrics.errorRate ?? 0,
            })
          : 0;

        // Enforce max size by evicting the lowest-priority entry
        if (queue.size() >= maxSize) {
          const all = queue.drain();
          all.slice(0, maxSize - 1).forEach((e) => queue.insert(e));
        }

        queue.insert({ route, method, score });
      } catch {
        // Non-critical: swallow scoring errors
      }
    });

    next();
  }

  function getQueue(): RoutePriorityQueue {
    return queue;
  }

  function reset(): void {
    queue.clear();
  }

  return { middleware, getQueue, reset };
}
