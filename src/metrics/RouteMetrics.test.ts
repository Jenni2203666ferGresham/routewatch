import { RouteMetrics, LatencySample } from './RouteMetrics';

describe('RouteMetrics', () => {
  let metrics: RouteMetrics;

  beforeEach(() => {
    metrics = new RouteMetrics();
  });

  const makeSample = (overrides: Partial<LatencySample> = {}): LatencySample => ({
    method: 'GET',
    path: '/api/users',
    latencyMs: 100,
    timestamp: new Date(),
    ...overrides,
  });

  it('records a new route sample', () => {
    metrics.record(makeSample());
    const all = metrics.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].hits).toBe(1);
    expect(all[0].method).toBe('GET');
    expect(all[0].path).toBe('/api/users');
  });

  it('accumulates hits for the same route', () => {
    metrics.record(makeSample({ latencyMs: 100 }));
    metrics.record(makeSample({ latencyMs: 200 }));
    const all = metrics.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].hits).toBe(2);
    expect(all[0].totalLatencyMs).toBe(300);
  });

  it('tracks min and max latency correctly', () => {
    metrics.record(makeSample({ latencyMs: 50 }));
    metrics.record(makeSample({ latencyMs: 300 }));
    metrics.record(makeSample({ latencyMs: 150 }));
    const all = metrics.getAll();
    expect(all[0].minLatencyMs).toBe(50);
    expect(all[0].maxLatencyMs).toBe(300);
  });

  it('computes average latency', () => {
    metrics.record(makeSample({ latencyMs: 100 }));
    metrics.record(makeSample({ latencyMs: 200 }));
    expect(metrics.getAvgLatency('GET', '/api/users')).toBe(150);
  });

  it('returns null for average latency on unknown route', () => {
    expect(metrics.getAvgLatency('POST', '/unknown')).toBeNull();
  });

  it('treats different methods as separate routes', () => {
    metrics.record(makeSample({ method: 'GET' }));
    metrics.record(makeSample({ method: 'POST' }));
    expect(metrics.getAll()).toHaveLength(2);
  });

  it('normalizes method to uppercase', () => {
    metrics.record(makeSample({ method: 'get' }));
    const all = metrics.getAll();
    expect(all[0].method).toBe('GET');
  });

  it('resets all records', () => {
    metrics.record(makeSample());
    metrics.reset();
    expect(metrics.getAll()).toHaveLength(0);
  });
});
