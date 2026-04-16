import { createCircuitBreakerMiddleware } from './circuitBreakerMiddleware';
import { MetricsStore } from '../metrics/MetricsStore';
import { RouteMetric } from '../metrics/RouteMetrics';

function makeStore(): MetricsStore {
  const records: RouteMetric[] = [];
  return {
    record: (m: RouteMetric) => records.push(m),
    getAll: () => records,
    getRoutes: () => [...new Set(records.map(r => r.route))],
  } as unknown as MetricsStore;
}

function makeMetric(route: string, statusCode: number): RouteMetric {
  return { method: 'GET', route, statusCode, latencyMs: 10, timestamp: Date.now() };
}

describe('createCircuitBreakerMiddleware', () => {
  it('records metrics into the store', () => {
    const store = makeStore();
    const mw = createCircuitBreakerMiddleware(store, { failureThreshold: 3 });
    mw.record(makeMetric('/api/test', 200));
    expect(store.getAll()).toHaveLength(1);
  });

  it('opens circuit after failure threshold', () => {
    const store = makeStore();
    const mw = createCircuitBreakerMiddleware(store, { failureThreshold: 3, recoveryTimeMs: 60000 });
    const key = 'GET:/api/fail';
    mw.record(makeMetric('/api/fail', 500));
    mw.record(makeMetric('/api/fail', 500));
    mw.record(makeMetric('/api/fail', 500));
    expect(mw.isOpen(key)).toBe(true);
  });

  it('does not open on successful requests', () => {
    const store = makeStore();
    const mw = createCircuitBreakerMiddleware(store, { failureThreshold: 3 });
    mw.record(makeMetric('/api/ok', 200));
    mw.record(makeMetric('/api/ok', 201));
    expect(mw.isOpen('GET:/api/ok')).toBe(false);
  });

  it('calls onOpen callback when circuit opens', () => {
    const onOpen = jest.fn();
    const store = makeStore();
    const mw = createCircuitBreakerMiddleware(store, { failureThreshold: 2, onOpen });
    mw.record(makeMetric('/api/x', 500));
    mw.record(makeMetric('/api/x', 500));
    expect(onOpen).toHaveBeenCalledWith('GET:/api/x');
  });

  it('getStats returns state for all tracked routes', () => {
    const store = makeStore();
    const mw = createCircuitBreakerMiddleware(store, { failureThreshold: 5 });
    mw.record(makeMetric('/a', 200));
    mw.record(makeMetric('/b', 500));
    const stats = mw.getStats();
    expect(stats['GET:/a']).toBeDefined();
    expect(stats['GET:/b']).toBeDefined();
    expect(stats['GET:/a'].state).toBe('closed');
  });

  it('reset removes the breaker for a route', () => {
    const store = makeStore();
    const mw = createCircuitBreakerMiddleware(store, { failureThreshold: 2 });
    mw.record(makeMetric('/api/r', 500));
    mw.record(makeMetric('/api/r', 500));
    expect(mw.isOpen('GET:/api/r')).toBe(true);
    mw.reset('GET:/api/r');
    expect(mw.isOpen('GET:/api/r')).toBe(false);
  });
});
