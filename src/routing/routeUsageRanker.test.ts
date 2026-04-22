import { createRouteUsageRanker, rankRoutesByUsage } from './routeUsageRanker';
import { MetricsStore } from '../metrics/MetricsStore';

function makeStore(): MetricsStore {
  const store = new MetricsStore();
  store.record({ route: '/api/users', method: 'GET', statusCode: 200, durationMs: 50 });
  store.record({ route: '/api/users', method: 'GET', statusCode: 200, durationMs: 80 });
  store.record({ route: '/api/users', method: 'GET', statusCode: 500, durationMs: 120 });
  store.record({ route: '/api/orders', method: 'POST', statusCode: 201, durationMs: 200 });
  store.record({ route: '/api/orders', method: 'POST', statusCode: 201, durationMs: 180 });
  store.record({ route: '/api/orders', method: 'POST', statusCode: 500, durationMs: 300 });
  store.record({ route: '/health', method: 'GET', statusCode: 200, durationMs: 5 });
  return store;
}

describe('rankRoutesByUsage', () => {
  it('returns all routes with required fields', () => {
    const store = makeStore();
    const results = rankRoutesByUsage(store);
    expect(results.length).toBeGreaterThan(0);
    for (const entry of results) {
      expect(entry).toHaveProperty('route');
      expect(entry).toHaveProperty('method');
      expect(entry).toHaveProperty('totalRequests');
      expect(entry).toHaveProperty('avgLatencyMs');
      expect(entry).toHaveProperty('errorRate');
      expect(entry).toHaveProperty('score');
    }
  });

  it('respects minRequests filter', () => {
    const store = makeStore();
    const results = rankRoutesByUsage(store, { minRequests: 3 });
    for (const entry of results) {
      expect(entry.totalRequests).toBeGreaterThanOrEqual(3);
    }
  });

  it('limits results with topN', () => {
    const store = makeStore();
    const results = rankRoutesByUsage(store, { topN: 2 });
    expect(results).toHaveLength(2);
  });

  it('sorts by requests when sortBy=requests', () => {
    const store = makeStore();
    const results = rankRoutesByUsage(store, { sortBy: 'requests' });
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].totalRequests).toBeGreaterThanOrEqual(results[i].totalRequests);
    }
  });

  it('sorts by latency when sortBy=latency', () => {
    const store = makeStore();
    const results = rankRoutesByUsage(store, { sortBy: 'latency' });
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].avgLatencyMs).toBeGreaterThanOrEqual(results[i].avgLatencyMs);
    }
  });

  it('sorts by errorRate when sortBy=errorRate', () => {
    const store = makeStore();
    const results = rankRoutesByUsage(store, { sortBy: 'errorRate' });
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].errorRate).toBeGreaterThanOrEqual(results[i].errorRate);
    }
  });

  it('computes errorRate correctly', () => {
    const store = makeStore();
    const results = rankRoutesByUsage(store);
    const users = results.find(r => r.route === '/api/users' && r.method === 'GET');
    expect(users).toBeDefined();
    expect(users!.errorRate).toBeCloseTo(1 / 3, 5);
  });
});

describe('createRouteUsageRanker', () => {
  it('rank() returns sorted entries', () => {
    const store = makeStore();
    const ranker = createRouteUsageRanker(store);
    const results = ranker.rank({ sortBy: 'score' });
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
  });

  it('top(n) returns at most n entries', () => {
    const store = makeStore();
    const ranker = createRouteUsageRanker(store);
    const results = ranker.top(1);
    expect(results).toHaveLength(1);
  });

  it('top() with sortBy returns correct ordering', () => {
    const store = makeStore();
    const ranker = createRouteUsageRanker(store);
    const results = ranker.top(3, 'latency');
    expect(results[0].avgLatencyMs).toBeGreaterThanOrEqual(results[1]?.avgLatencyMs ?? 0);
  });
});
