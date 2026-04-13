import { createFilterPipeline } from './filterPipeline';
import { MetricsStore } from '../metrics/MetricsStore';
import { RouteMetric } from '../metrics/RouteMetrics';

function makeMetric(route: string, method = 'GET', statusCode = 200): RouteMetric {
  return { route, method, statusCode, latencyMs: 42, timestamp: Date.now() };
}

function makeStore(): MetricsStore {
  return new MetricsStore();
}

describe('createFilterPipeline', () => {
  it('allows all routes when no options provided', () => {
    const pipeline = createFilterPipeline();
    expect(pipeline.process(makeMetric('/api/users'))).toBe(true);
    expect(pipeline.process(makeMetric('/health'))).toBe(true);
  });

  it('excludes matching routes', () => {
    const pipeline = createFilterPipeline({ exclude: ['/health', '/metrics'] });
    expect(pipeline.process(makeMetric('/health'))).toBe(false);
    expect(pipeline.process(makeMetric('/metrics'))).toBe(false);
    expect(pipeline.process(makeMetric('/api/users'))).toBe(true);
  });

  it('includes only matching routes when include is set', () => {
    const pipeline = createFilterPipeline({ include: ['/api/*'] });
    expect(pipeline.process(makeMetric('/api/users'))).toBe(true);
    expect(pipeline.process(makeMetric('/api/orders'))).toBe(true);
    expect(pipeline.process(makeMetric('/health'))).toBe(false);
  });

  it('filters by HTTP method', () => {
    const pipeline = createFilterPipeline({ methods: ['GET', 'POST'] });
    expect(pipeline.process(makeMetric('/api/users', 'GET'))).toBe(true);
    expect(pipeline.process(makeMetric('/api/users', 'POST'))).toBe(true);
    expect(pipeline.process(makeMetric('/api/users', 'DELETE'))).toBe(false);
  });

  it('tracks stats correctly', () => {
    const pipeline = createFilterPipeline({ exclude: ['/health'] });
    pipeline.process(makeMetric('/api/users'));
    pipeline.process(makeMetric('/health'));
    pipeline.process(makeMetric('/api/orders'));

    const stats = pipeline.getStats();
    expect(stats.processed).toBe(3);
    expect(stats.allowed).toBe(2);
    expect(stats.rejected).toBe(1);
  });

  it('resets stats', () => {
    const pipeline = createFilterPipeline();
    pipeline.process(makeMetric('/api/users'));
    pipeline.reset();
    const stats = pipeline.getStats();
    expect(stats.processed).toBe(0);
    expect(stats.allowed).toBe(0);
    expect(stats.rejected).toBe(0);
  });

  it('processAndRecord records allowed metrics into store', () => {
    const pipeline = createFilterPipeline({ exclude: ['/health'] });
    const store = makeStore();
    pipeline.processAndRecord(makeMetric('/api/users'), store);
    pipeline.processAndRecord(makeMetric('/health'), store);
    const all = store.getAll();
    expect(all.length).toBe(1);
    expect(all[0].route).toBe('/api/users');
  });

  it('throws on invalid config', () => {
    expect(() => createFilterPipeline({ include: [''] })).toThrow();
  });
});
