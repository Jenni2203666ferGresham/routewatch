import { createDedupeMiddleware } from './dedupeMiddleware';
import { createMetricsStore } from '../metrics/MetricsStore';
import { RouteMetric } from '../metrics/RouteMetrics';

function makeMetric(route: string, method = 'GET', latency = 100, status = 200): RouteMetric {
  return { route, method, latency, statusCode: status, timestamp: Date.now() };
}

function makeStore() {
  return createMetricsStore();
}

describe('createDedupeMiddleware', () => {
  it('records a new metric', () => {
    const store = makeStore();
    const mw = createDedupeMiddleware(store);
    const m = makeMetric('/api/users');
    const result = mw.recordIfNew(m);
    expect(result).toBe(true);
    expect(store.getAll()).toHaveLength(1);
  });

  it('does not record duplicate within window', () => {
    const store = makeStore();
    const mw = createDedupeMiddleware(store, { windowMs: 5000 });
    const m = makeMetric('/api/users');
    mw.recordIfNew(m);
    const result = mw.recordIfNew({ ...m, latency: 200 });
    expect(result).toBe(false);
    expect(store.getAll()).toHaveLength(1);
  });

  it('records again after window expires', () => {
    jest.useFakeTimers();
    const store = makeStore();
    const mw = createDedupeMiddleware(store, { windowMs: 1000 });
    const m = makeMetric('/api/orders');
    mw.recordIfNew(m);
    jest.advanceTimersByTime(1500);
    const result = mw.recordIfNew({ ...m, latency: 300 });
    expect(result).toBe(true);
    expect(store.getAll()).toHaveLength(2);
    jest.useRealTimers();
  });

  it('tracks stats correctly', () => {
    const store = makeStore();
    const mw = createDedupeMiddleware(store);
    mw.recordIfNew(makeMetric('/a'));
    mw.recordIfNew(makeMetric('/a'));
    mw.recordIfNew(makeMetric('/b'));
    const stats = mw.getStats();
    expect(stats.total).toBe(3);
    expect(stats.recorded).toBe(2);
    expect(stats.skipped).toBe(1);
  });

  it('resets stats', () => {
    const store = makeStore();
    const mw = createDedupeMiddleware(store);
    mw.recordIfNew(makeMetric('/a'));
    mw.reset();
    const stats = mw.getStats();
    expect(stats.total).toBe(0);
    expect(stats.recorded).toBe(0);
  });
});
