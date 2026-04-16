import { createCircuitBreaker } from './circuitBreaker';
import { RouteMetric } from '../metrics/RouteMetrics';
import { MetricsStore } from '../metrics/MetricsStore';

export interface CircuitBreakerMiddlewareOptions {
  failureThreshold?: number;
  recoveryTimeMs?: number;
  halfOpenRequests?: number;
  onOpen?: (route: string) => void;
  onClose?: (route: string) => void;
}

export interface CircuitBreakerMiddleware {
  record: (metric: RouteMetric) => void;
  isOpen: (route: string) => boolean;
  getStats: () => Record<string, { state: string; failures: number; successes: number }>;
  reset: (route: string) => void;
}

export function createCircuitBreakerMiddleware(
  store: MetricsStore,
  options: CircuitBreakerMiddlewareOptions = {}
): CircuitBreakerMiddleware {
  const breakers = new Map<string, ReturnType<typeof createCircuitBreaker>>();

  function ensure(route: string) {
    if (!breakers.has(route)) {
      breakers.set(
        route,
        createCircuitBreaker({
          failureThreshold: options.failureThreshold ?? 5,
          recoveryTimeMs: options.recoveryTimeMs ?? 30000,
          halfOpenRequests: options.halfOpenRequests ?? 1,
        })
      );
    }
    return breakers.get(route)!;
  }

  function record(metric: RouteMetric): void {
    const key = `${metric.method}:${metric.route}`;
    const cb = ensure(key);
    const prevState = cb.getState();
    if (metric.statusCode >= 500) {
      cb.recordFailure();
    } else {
      cb.recordSuccess();
    }
    const nextState = cb.getState();
    if (prevState !== 'open' && nextState === 'open') {
      options.onOpen?.(key);
    } else if (prevState === 'open' && nextState === 'closed') {
      options.onClose?.(key);
    }
    store.record(metric);
  }

  function isOpen(route: string): boolean {
    if (!breakers.has(route)) return false;
    return breakers.get(route)!.getState() === 'open';
  }

  function getStats() {
    const result: Record<string, { state: string; failures: number; successes: number }> = {};
    for (const [route, cb] of breakers.entries()) {
      result[route] = { state: cb.getState(), ...cb.getCounts() };
    }
    return result;
  }

  function reset(route: string): void {
    breakers.delete(route);
  }

  return { record, isOpen, getStats, reset };
}
