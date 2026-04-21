import { IncomingMessage, ServerResponse } from 'http';
import { createRouteCostEstimator, RouteCostEstimate } from './routeCostEstimator';
import { MetricsStore } from '../metrics/MetricsStore';

export interface RouteCostMiddlewareOptions {
  store: MetricsStore;
  windowMs?: number;
}

export interface CostMiddlewareHandle {
  middleware: (req: IncomingMessage, res: ServerResponse, next: () => void) => void;
  getEstimates: () => RouteCostEstimate[];
  getRanked: () => RouteCostEstimate[];
  reset: () => void;
}

export function createRouteCostMiddleware(options: RouteCostMiddlewareOptions): CostMiddlewareHandle {
  const estimator = createRouteCostEstimator();
  const { store } = options;

  function refreshEstimates(): void {
    const routes = store.getAll();
    for (const [key, metrics] of Object.entries(routes)) {
      const parts = key.split(':');
      if (parts.length < 2) continue;
      const method = parts[0];
      const path = parts.slice(1).join(':');
      const latencies = metrics.latencies ?? [];
      const avgLatencyMs = latencies.length
        ? latencies.reduce((a: number, b: number) => a + b, 0) / latencies.length
        : 0;
      const callsPerMinute = metrics.count ?? 0;
      const errors = metrics.errorCount ?? 0;
      const errorRate = callsPerMinute > 0 ? errors / callsPerMinute : 0;
      estimator.estimate({ method, path, avgLatencyMs, callsPerMinute, errorRate });
    }
  }

  function middleware(req: IncomingMessage, res: ServerResponse, next: () => void): void {
    refreshEstimates();
    next();
  }

  return {
    middleware,
    getEstimates: () => estimator.getAll(),
    getRanked: () => estimator.getRanked(),
    reset: () => estimator.reset(),
  };
}
