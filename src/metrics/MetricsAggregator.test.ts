import { MetricsStore } from './MetricsStore';
import {
  aggregateMetrics,
  getSlowestRoutes,
  getHighestErrorRoutes,
  percentile,
} from './MetricsAggregator';

function buildStore(entries: Array<{ route: string; method: string; latencies: number[]; errors: number }>) {
  const store = new MetricsStore();
  for (const e of entries) {
    for (let i = 0; i < e.latencies.length; i++) {
      store.record(e.route, e.method, e.latencies[i], i < e.errors);
    }
  }
  return store;
}

describe('percentile', () => {
  it('returns 0 for empty array', () => {
    expect(percentile([], 95)).toBe(0);
  });

  it('returns correct p50 for odd-length array', () => {
    expect(percentile([10, 20, 30, 40, 50], 50)).toBe(30);
  });

  it('returns max for p100', () => {
    expect(percentile([10, 20, 30], 100)).toBe(30);
  });
});

describe('aggregateMetrics', () => {
  it('returns empty array when store is empty', () => {
    const store = new MetricsStore();
    expect(aggregateMetrics(store)).toEqual([]);
  });

  it('computes avgLatency correctly', () => {
    const store = buildStore([{ route: '/api/test', method: 'GET', latencies: [100, 200, 300], errors: 0 }]);
    const [stat] = aggregateMetrics(store);
    expect(stat.avgLatency).toBe(200);
  });

  it('computes errorRate correctly', () => {
    const store = buildStore([{ route: '/api/fail', method: 'POST', latencies: [50, 60, 70, 80], errors: 2 }]);
    const [stat] = aggregateMetrics(store);
    expect(stat.errorRate).toBe(0.5);
  });

  it('sorts by totalRequests descending', () => {
    const store = buildStore([
      { route: '/a', method: 'GET', latencies: [10], errors: 0 },
      { route: '/b', method: 'GET', latencies: [10, 20, 30], errors: 0 },
    ]);
    const stats = aggregateMetrics(store);
    expect(stats[0].route).toBe('/b');
    expect(stats[1].route).toBe('/a');
  });
});

describe('getSlowestRoutes', () => {
  it('returns top N slowest by avgLatency', () => {
    const store = buildStore([
      { route: '/fast', method: 'GET', latencies: [10, 20], errors: 0 },
      { route: '/slow', method: 'GET', latencies: [500, 600], errors: 0 },
      { route: '/medium', method: 'GET', latencies: [100, 150], errors: 0 },
    ]);
    const result = getSlowestRoutes(store, 2);
    expect(result[0].route).toBe('/slow');
    expect(result[1].route).toBe('/medium');
  });
});

describe('getHighestErrorRoutes', () => {
  it('returns top N routes by errorRate', () => {
    const store = buildStore([
      { route: '/ok', method: 'GET', latencies: [10, 20, 30], errors: 0 },
      { route: '/bad', method: 'GET', latencies: [10, 20], errors: 2 },
    ]);
    const result = getHighestErrorRoutes(store, 1);
    expect(result[0].route).toBe('/bad');
  });
});
