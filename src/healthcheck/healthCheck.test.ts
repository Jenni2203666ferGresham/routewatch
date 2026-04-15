import { checkHealth, HealthCheckConfig } from './healthCheck';
import { MetricsStore } from '../metrics/MetricsStore';
import { RouteMetric } from '../metrics/RouteMetrics';

function makeStore(entries: Record<string, RouteMetric[]>): MetricsStore {
  const store = new MetricsStore();
  for (const [key, metrics] of Object.entries(entries)) {
    for (const m of metrics) store.record(key, m);
  }
  return store;
}

function makeMetric(latency: number, statusCode: number): RouteMetric {
  return { method: 'GET', route: '/test', statusCode, latencyMs: latency, timestamp: Date.now() };
}

const startTime = Date.now() - 5000;

describe('checkHealth', () => {
  it('returns healthy for empty store', () => {
    const store = makeStore({});
    const result = checkHealth(store, startTime);
    expect(result.status).toBe('healthy');
    expect(result.totalRequests).toBe(0);
    expect(result.routeCount).toBe(0);
  });

  it('returns healthy when error rate and latency are low', () => {
    const store = makeStore({
      'GET /fast': [makeMetric(50, 200), makeMetric(60, 200), makeMetric(55, 200)],
    });
    const result = checkHealth(store, startTime);
    expect(result.status).toBe('healthy');
    expect(result.totalRequests).toBe(3);
  });

  it('returns degraded when error rate exceeds degraded threshold', () => {
    const metrics = [
      makeMetric(100, 200),
      makeMetric(100, 200),
      makeMetric(100, 200),
      makeMetric(100, 200),
      makeMetric(100, 200),
      makeMetric(100, 500),
      makeMetric(100, 500),
    ];
    const store = makeStore({ 'GET /api': metrics });
    const result = checkHealth(store, startTime);
    expect(result.status).toBe('degraded');
  });

  it('returns unhealthy when error rate exceeds unhealthy threshold', () => {
    const metrics = Array.from({ length: 5 }, () => makeMetric(100, 500));
    const store = makeStore({ 'POST /crash': metrics });
    const result = checkHealth(store, startTime);
    expect(result.status).toBe('unhealthy');
  });

  it('returns degraded when avg latency is high', () => {
    const store = makeStore({
      'GET /slow': [makeMetric(600, 200), makeMetric(700, 200)],
    });
    const result = checkHealth(store, startTime);
    expect(result.status).toBe('degraded');
  });

  it('returns unhealthy when avg latency is very high', () => {
    const store = makeStore({
      'GET /veryslow': [makeMetric(2500, 200), makeMetric(3000, 200)],
    });
    const result = checkHealth(store, startTime);
    expect(result.status).toBe('unhealthy');
  });

  it('respects custom thresholds', () => {
    const store = makeStore({
      'GET /ok': [makeMetric(100, 200)],
    });
    const config: Partial<HealthCheckConfig> = { degradedLatencyMs: 50 };
    const result = checkHealth(store, startTime, config);
    expect(result.status).toBe('degraded');
  });

  it('includes uptime and checkedAt in result', () => {
    const store = makeStore({});
    const result = checkHealth(store, startTime);
    expect(result.uptime).toBeGreaterThan(0);
    expect(result.checkedAt).toMatch(/^\d{4}-/);
  });
});
