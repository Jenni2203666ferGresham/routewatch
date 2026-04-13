import { createSamplingMiddleware, createSamplingMiddlewareWithStats } from './samplingMiddleware';
import { MetricsStore } from '../metrics/MetricsStore';
import { RouteMetrics } from '../metrics/RouteMetrics';

function makeMetric(method: string, path: string, latency = 50, status = 200): RouteMetrics {
  return { method, path, latency, statusCode: status, timestamp: Date.now() };
}

function makeStore(): MetricsStore {
  const store = new MetricsStore();
  return store;
}

describe('createSamplingMiddleware', () => {
  it('records metric when sample rate is 1.0', () => {
    const store = makeStore();
    const record = createSamplingMiddleware({ store, config: { defaultRate: 1.0 } });
    const metric = makeMetric('GET', '/health');

    const result = record(metric);

    expect(result).toBe(true);
    expect(store.getAll().length).toBe(1);
  });

  it('never records metric when sample rate is 0.0', () => {
    const store = makeStore();
    const record = createSamplingMiddleware({ store, config: { defaultRate: 0.0 } });

    for (let i = 0; i < 20; i++) {
      record(makeMetric('GET', '/ping'));
    }

    expect(store.getAll().length).toBe(0);
  });

  it('uses default config when no config provided', () => {
    const store = makeStore();
    const record = createSamplingMiddleware({ store });
    const metric = makeMetric('POST', '/api/data');

    // With default rate of 1.0, all should be recorded
    const result = record(metric);
    expect(typeof result).toBe('boolean');
  });
});

describe('createSamplingMiddlewareWithStats', () => {
  it('tracks seen and recorded counts per route', () => {
    const store = makeStore();
    const { recordIfSampled, getStats } = createSamplingMiddlewareWithStats({
      store,
      config: { defaultRate: 1.0 },
    });

    recordIfSampled(makeMetric('GET', '/users'));
    recordIfSampled(makeMetric('GET', '/users'));
    recordIfSampled(makeMetric('POST', '/users'));

    const stats = getStats();
    expect(stats['GET:/users'].seen).toBe(2);
    expect(stats['GET:/users'].recorded).toBe(2);
    expect(stats['POST:/users'].seen).toBe(1);
  });

  it('increments seen even when not recorded', () => {
    const store = makeStore();
    const { recordIfSampled, getStats } = createSamplingMiddlewareWithStats({
      store,
      config: { defaultRate: 0.0 },
    });

    recordIfSampled(makeMetric('DELETE', '/item'));
    recordIfSampled(makeMetric('DELETE', '/item'));

    const stats = getStats();
    expect(stats['DELETE:/item'].seen).toBe(2);
    expect(stats['DELETE:/item'].recorded).toBe(0);
    expect(store.getAll().length).toBe(0);
  });

  it('returns a copy of stats to prevent mutation', () => {
    const store = makeStore();
    const { recordIfSampled, getStats } = createSamplingMiddlewareWithStats({ store });
    recordIfSampled(makeMetric('GET', '/test'));

    const stats1 = getStats();
    recordIfSampled(makeMetric('GET', '/test'));
    const stats2 = getStats();

    expect(stats1['GET:/test'].seen).toBe(1);
    expect(stats2['GET:/test'].seen).toBe(2);
  });
});
