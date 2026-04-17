import { createBudgetMonitor } from './budgetMonitor';
import { MetricsStore } from '../metrics/MetricsStore';
import { LatencyBudget } from './latencyBudget';

function makeStore(): MetricsStore {
  const store = new MetricsStore();
  store.record('GET', '/api/fast', 80);
  store.record('GET', '/api/fast', 90);
  store.record('GET', '/api/fast', 100);
  store.record('GET', '/api/slow', 600);
  store.record('GET', '/api/slow', 800);
  store.record('GET', '/api/slow', 1200);
  return store;
}

const budgets: LatencyBudget[] = [
  { route: '/api/fast', method: 'GET', p50Ms: 200, p95Ms: 500, p99Ms: 1000 },
  { route: '/api/slow', method: 'GET', p50Ms: 200, p95Ms: 500, p99Ms: 1000 },
];

describe('createBudgetMonitor', () => {
  it('returns no violations for a fast route', () => {
    const monitor = createBudgetMonitor(makeStore(), budgets.slice(0, 1));
    const violations = monitor.check();
    expect(violations.filter((v) => v.route === '/api/fast')).toHaveLength(0);
  });

  it('returns violations for a slow route', () => {
    const monitor = createBudgetMonitor(makeStore(), budgets);
    const violations = monitor.check().filter((v) => v.route === '/api/slow');
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].exceededBy).toBeGreaterThan(0);
  });

  it('addBudget adds a new budget', () => {
    const monitor = createBudgetMonitor(makeStore(), []);
    monitor.addBudget({ route: '/api/slow', method: 'GET', p50Ms: 100, p95Ms: 200, p99Ms: 300 });
    expect(monitor.getBudgets()).toHaveLength(1);
  });

  it('addBudget replaces existing budget for same route+method', () => {
    const monitor = createBudgetMonitor(makeStore(), budgets);
    monitor.addBudget({ route: '/api/fast', method: 'GET', p50Ms: 10, p95Ms: 20, p99Ms: 30 });
    expect(monitor.getBudgets().filter((b) => b.route === '/api/fast')).toHaveLength(1);
    expect(monitor.getBudgets().find((b) => b.route === '/api/fast')!.p50Ms).toBe(10);
  });

  it('removeBudget removes the correct budget', () => {
    const monitor = createBudgetMonitor(makeStore(), budgets);
    monitor.removeBudget('/api/fast', 'GET');
    expect(monitor.getBudgets().find((b) => b.route === '/api/fast')).toBeUndefined();
    expect(monitor.getBudgets()).toHaveLength(1);
  });

  it('check returns empty when no budgets', () => {
    const monitor = createBudgetMonitor(makeStore(), []);
    expect(monitor.check()).toEqual([]);
  });
});
