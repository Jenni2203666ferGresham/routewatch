import { MetricsStore } from './MetricsStore';

describe('MetricsStore', () => {
  let store: MetricsStore;

  beforeEach(() => {
    store = new MetricsStore();
  });

  it('should start empty', () => {
    expect(store.size).toBe(0);
    expect(store.getSnapshot()).toEqual([]);
  });

  it('should record a new route and increment size', () => {
    store.record('GET', '/api/users', 120, false);
    expect(store.size).toBe(1);
  });

  it('should accumulate records for the same route', () => {
    store.record('GET', '/api/users', 100, false);
    store.record('GET', '/api/users', 200, false);
    store.record('GET', '/api/users', 300, true);

    const rm = store.getRouteMetrics('GET', '/api/users');
    expect(rm).toBeDefined();
    expect(rm!.count).toBe(3);
    expect(rm!.errorCount).toBe(1);
  });

  it('should treat different methods as separate routes', () => {
    store.record('GET', '/api/users', 100, false);
    store.record('POST', '/api/users', 150, false);
    expect(store.size).toBe(2);
  });

  it('should return a snapshot with correct shape', () => {
    store.record('GET', '/health', 50, false);
    const snapshot = store.getSnapshot();

    expect(snapshot).toHaveLength(1);
    expect(snapshot[0]).toMatchObject({
      route: '/health',
      method: 'GET',
      metrics: expect.objectContaining({
        count: 1,
        errorCount: 0,
        avgLatency: expect.any(Number),
        p95Latency: expect.any(Number),
        errorRate: 0,
      }),
    });
  });

  it('should reset all stored metrics', () => {
    store.record('GET', '/api/items', 80, false);
    store.record('DELETE', '/api/items', 90, true);
    expect(store.size).toBe(2);

    store.reset();
    expect(store.size).toBe(0);
    expect(store.getSnapshot()).toEqual([]);
  });

  it('should return undefined for unknown route', () => {
    expect(store.getRouteMetrics('GET', '/nonexistent')).toBeUndefined();
  });
});
