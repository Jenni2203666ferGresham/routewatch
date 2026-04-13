import { createDashboardState, snapshotDashboard } from './dashboardState';
import { MetricsStore } from '../metrics/MetricsStore';

function buildPopulatedStore(): MetricsStore {
  const store = new MetricsStore();
  store.record('GET', '/api/users', 120, false);
  store.record('GET', '/api/users', 200, false);
  store.record('GET', '/api/users', 95, true);
  store.record('POST', '/api/orders', 300, false);
  store.record('POST', '/api/orders', 450, true);
  return store;
}

describe('createDashboardState', () => {
  it('creates state with defaults', () => {
    const store = new MetricsStore();
    const state = createDashboardState(store);
    expect(state.topN).toBe(10);
    expect(state.refreshIntervalMs).toBe(2000);
    expect(state.store).toBe(store);
    expect(state.alertPipeline).toBeUndefined();
  });

  it('respects custom options', () => {
    const store = new MetricsStore();
    const state = createDashboardState(store, { topN: 5, refreshIntervalMs: 1000 });
    expect(state.topN).toBe(5);
    expect(state.refreshIntervalMs).toBe(1000);
  });

  it('sets lastUpdated to a recent date', () => {
    const before = Date.now();
    const state = createDashboardState(new MetricsStore());
    expect(state.lastUpdated.getTime()).toBeGreaterThanOrEqual(before);
  });
});

describe('snapshotDashboard', () => {
  it('returns rows for all recorded routes', () => {
    const store = buildPopulatedStore();
    const state = createDashboardState(store);
    const snapshot = snapshotDashboard(state);
    expect(snapshot.rows).toHaveLength(2);
    const routeNames = snapshot.rows.map((r) => r.route);
    expect(routeNames).toContain('/api/users');
    expect(routeNames).toContain('/api/orders');
  });

  it('row contains expected numeric fields', () => {
    const store = buildPopulatedStore();
    const state = createDashboardState(store);
    const snapshot = snapshotDashboard(state);
    const usersRow = snapshot.rows.find((r) => r.route === '/api/users');
    expect(usersRow).toBeDefined();
    expect(usersRow!.count).toBe(3);
    expect(usersRow!.p50).toBeGreaterThan(0);
    expect(usersRow!.errorRate).toBeCloseTo(1 / 3, 2);
  });

  it('returns slowest and highest error routes', () => {
    const store = buildPopulatedStore();
    const state = createDashboardState(store);
    const snapshot = snapshotDashboard(state);
    expect(Array.isArray(snapshot.slowestRoutes)).toBe(true);
    expect(Array.isArray(snapshot.highestErrorRoutes)).toBe(true);
  });

  it('returns empty activeAlerts when no pipeline provided', () => {
    const store = buildPopulatedStore();
    const state = createDashboardState(store);
    const snapshot = snapshotDashboard(state);
    expect(snapshot.activeAlerts).toEqual([]);
  });

  it('includes lastUpdated timestamp', () => {
    const before = Date.now();
    const store = buildPopulatedStore();
    const state = createDashboardState(store);
    const snapshot = snapshotDashboard(state);
    expect(snapshot.lastUpdated.getTime()).toBeGreaterThanOrEqual(before);
  });
});
