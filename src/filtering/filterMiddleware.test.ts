import { createFilterMiddleware, createFilterMiddlewareWithStats } from './filterMiddleware';
import { MetricsStore } from '../metrics/MetricsStore';
import { RouteMetrics } from '../metrics/RouteMetrics';

function makeStore(): MetricsStore {
  return new MetricsStore();
}

function makeMetric(route: string, statusCode = 200, latency = 50): RouteMetrics {
  return { route, method: 'GET', statusCode, latencyMs: latency, timestamp: Date.now() };
}

describe('createFilterMiddleware', () => {
  it('records a metric when route matches the allowlist', () => {
    const store = makeStore();
    const record = createFilterMiddleware({
      store,
      filterConfig: { include: ['/api/*'] },
    });
    const result = record(makeMetric('/api/users'));
    expect(result).toBe(true);
    expect(store.getAll()).toHaveLength(1);
  });

  it('does not record a metric when route is excluded', () => {
    const store = makeStore();
    const record = createFilterMiddleware({
      store,
      filterConfig: { exclude: ['/health'] },
    });
    const result = record(makeMetric('/health'));
    expect(result).toBe(false);
    expect(store.getAll()).toHaveLength(0);
  });

  it('records when no filters are configured', () => {
    const store = makeStore();
    const record = createFilterMiddleware({ store, filterConfig: {} });
    record(makeMetric('/anything'));
    expect(store.getAll()).toHaveLength(1);
  });
});

describe('createFilterMiddlewareWithStats', () => {
  it('tracks recorded and filtered counts', () => {
    const store = makeStore();
    const { recordIfAllowed, getStats } = createFilterMiddlewareWithStats({
      store,
      filterConfig: { exclude: ['/health'] },
    });

    recordIfAllowed(makeMetric('/api/users'));
    recordIfAllowed(makeMetric('/health'));
    recordIfAllowed(makeMetric('/api/orders'));

    const stats = getStats();
    expect(stats.recorded).toBe(2);
    expect(stats.filtered).toBe(1);
    expect(stats.total).toBe(3);
  });

  it('starts with zero counts', () => {
    const store = makeStore();
    const { getStats } = createFilterMiddlewareWithStats({
      store,
      filterConfig: {},
    });
    expect(getStats()).toEqual({ recorded: 0, filtered: 0, total: 0 });
  });
});
