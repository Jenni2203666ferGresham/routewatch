import { detectAnomalies } from './anomalyDetector';
import { MetricsStore } from '../metrics/MetricsStore';

function buildStore(entries: Array<{ route: string; method: string; latency: number; isError: boolean }[]>): MetricsStore {
  const store = new MetricsStore();
  for (const group of entries) {
    for (const e of group) {
      store.record({ route: e.route, method: e.method, statusCode: e.isError ? 500 : 200, latencyMs: e.latency, timestamp: Date.now() });
    }
  }
  return store;
}

function makeMetrics(route: string, method: string, count: number, latency: number, errorRate = 0) {
  return Array.from({ length: count }, (_, i) => ({
    route, method, latency, isError: i < Math.round(count * errorRate),
  }));
}

describe('detectAnomalies', () => {
  it('returns empty when no anomalies', () => {
    const base = buildStore([makeMetrics('/api/users', 'GET', 10, 50)]);
    const curr = buildStore([makeMetrics('/api/users', 'GET', 10, 55)]);
    const results = detectAnomalies(curr, base);
    expect(results).toHaveLength(0);
  });

  it('detects latency spike', () => {
    const base = buildStore([makeMetrics('/api/users', 'GET', 10, 50)]);
    const curr = buildStore([makeMetrics('/api/users', 'GET', 10, 200)]);
    const results = detectAnomalies(curr, base);
    expect(results.some(r => r.type === 'latency_spike')).toBe(true);
    const anomaly = results.find(r => r.type === 'latency_spike')!;
    expect(anomaly.route).toBe('/api/users');
    expect(anomaly.method).toBe('GET');
    expect(anomaly.value).toBeGreaterThan(anomaly.baseline);
  });

  it('assigns high severity for extreme latency spike', () => {
    const base = buildStore([makeMetrics('/slow', 'GET', 10, 50)]);
    const curr = buildStore([makeMetrics('/slow', 'GET', 10, 500)]);
    const results = detectAnomalies(curr, base);
    const anomaly = results.find(r => r.type === 'latency_spike')!;
    expect(anomaly.severity).toBe('high');
  });

  it('detects error surge', () => {
    const base = buildStore([makeMetrics('/api/orders', 'POST', 10, 40, 0.1)]);
    const curr = buildStore([makeMetrics('/api/orders', 'POST', 10, 40, 0.8)]);
    const results = detectAnomalies(curr, base);
    expect(results.some(r => r.type === 'error_surge')).toBe(true);
  });

  it('detects traffic drop', () => {
    const base = buildStore([makeMetrics('/api/health', 'GET', 20, 10)]);
    const curr = buildStore([makeMetrics('/api/health', 'GET', 1, 10)]);
    const results = detectAnomalies(curr, base);
    expect(results.some(r => r.type === 'traffic_drop')).toBe(true);
  });

  it('skips routes without sufficient baseline data', () => {
    const base = buildStore([makeMetrics('/new', 'GET', 2, 50)]);
    const curr = buildStore([makeMetrics('/new', 'GET', 10, 500)]);
    const results = detectAnomalies(curr, base, { minRequestsForBaseline: 5 });
    expect(results).toHaveLength(0);
  });

  it('respects custom latency multiplier', () => {
    const base = buildStore([makeMetrics('/api/data', 'GET', 10, 100)]);
    const curr = buildStore([makeMetrics('/api/data', 'GET', 10, 180)]);
    const noAnomaly = detectAnomalies(curr, base, { latencySpikeMultiplier: 2.0 });
    const withAnomaly = detectAnomalies(curr, base, { latencySpikeMultiplier: 1.5 });
    expect(noAnomaly.filter(r => r.type === 'latency_spike')).toHaveLength(0);
    expect(withAnomaly.filter(r => r.type === 'latency_spike').length).toBeGreaterThan(0);
  });
});
