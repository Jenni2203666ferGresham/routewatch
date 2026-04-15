import { profileRoutes, summarizeProfile, RouteProfile } from './routeProfiler';
import { MetricsStore } from '../metrics/MetricsStore';

function buildStore(): MetricsStore {
  const store = new MetricsStore();
  const routes = [
    { method: 'GET', route: '/users', latencies: [10, 20, 30, 200, 250], errors: 1 },
    { method: 'POST', route: '/users', latencies: [5, 6, 7], errors: 0 },
    { method: 'GET', route: '/health', latencies: [1, 2], errors: 0 },
  ];
  for (const r of routes) {
    for (let i = 0; i < r.latencies.length; i++) {
      store.record({
        method: r.method,
        route: r.route,
        statusCode: i < r.errors ? 500 : 200,
        latencyMs: r.latencies[i],
        timestamp: Date.now(),
      });
    }
  }
  return store;
}

describe('profileRoutes', () => {
  it('returns a profile for each route in the store', () => {
    const store = buildStore();
    const profiles = profileRoutes(store);
    expect(profiles.length).toBe(3);
  });

  it('includes correct callCount', () => {
    const store = buildStore();
    const profiles = profileRoutes(store);
    const getUsers = profiles.find((p) => p.route === '/users' && p.method === 'GET');
    expect(getUsers?.callCount).toBe(5);
  });

  it('computes p95 latency', () => {
    const store = buildStore();
    const profiles = profileRoutes(store);
    const getUsers = profiles.find((p) => p.route === '/users' && p.method === 'GET');
    expect(getUsers?.p95).toBeGreaterThan(100);
  });

  it('respects minCallCount filter', () => {
    const store = buildStore();
    const profiles = profileRoutes(store, { minCallCount: 4 });
    expect(profiles.every((p) => p.callCount >= 4)).toBe(true);
  });

  it('respects limit option', () => {
    const store = buildStore();
    const profiles = profileRoutes(store, { limit: 2 });
    expect(profiles.length).toBeLessThanOrEqual(2);
  });

  it('sorts by callCount when specified', () => {
    const store = buildStore();
    const profiles = profileRoutes(store, { sortBy: 'callCount' });
    for (let i = 1; i < profiles.length; i++) {
      expect(profiles[i - 1].callCount).toBeGreaterThanOrEqual(profiles[i].callCount);
    }
  });

  it('returns empty array when store is empty', () => {
    const store = new MetricsStore();
    const profiles = profileRoutes(store);
    expect(profiles).toEqual([]);
  });
});

describe('summarizeProfile', () => {
  it('returns a no-data message for empty profiles', () => {
    const result = summarizeProfile([]);
    expect(result).toMatch(/No route profiles/);
  });

  it('includes route and method in output', () => {
    const store = buildStore();
    const profiles = profileRoutes(store);
    const summary = summarizeProfile(profiles);
    expect(summary).toMatch('/users');
    expect(summary).toMatch('GET');
  });

  it('includes p95 and error rate in output', () => {
    const store = buildStore();
    const profiles = profileRoutes(store);
    const summary = summarizeProfile(profiles);
    expect(summary).toMatch('p95=');
    expect(summary).toMatch('err=');
  });
});
