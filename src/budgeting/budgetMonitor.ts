import { LatencyBudget, BudgetViolation, evaluateBudgets } from './latencyBudget';
import { MetricsStore } from '../metrics/MetricsStore';
import { aggregateMetrics } from '../metrics/MetricsAggregator';

export interface BudgetMonitor {
  check(): BudgetViolation[];
  getBudgets(): LatencyBudget[];
  addBudget(budget: LatencyBudget): void;
  removeBudget(route: string, method: string): void;
}

export function createBudgetMonitor(
  store: MetricsStore,
  budgets: LatencyBudget[] = []
): BudgetMonitor {
  const list: LatencyBudget[] = [...budgets];

  function buildActuals(): Map<string, { p50: number; p95: number; p99: number }> {
    const map = new Map<string, { p50: number; p95: number; p99: number }>();
    const routes = store.getRoutes();
    for (const { method, path } of routes) {
      const metrics = store.get(method, path);
      if (!metrics || metrics.latencies.length === 0) continue;
      const agg = aggregateMetrics(metrics.latencies);
      map.set(`${method.toUpperCase()}:${path}`, {
        p50: agg.p50,
        p95: agg.p95,
        p99: agg.p99,
      });
    }
    return map;
  }

  return {
    check(): BudgetViolation[] {
      return evaluateBudgets(list, buildActuals());
    },
    getBudgets(): LatencyBudget[] {
      return [...list];
    },
    addBudget(budget: LatencyBudget): void {
      const idx = list.findIndex(
        (b) => b.route === budget.route && b.method === budget.method
      );
      if (idx >= 0) list[idx] = budget;
      else list.push(budget);
    },
    removeBudget(route: string, method: string): void {
      const idx = list.findIndex(
        (b) => b.route === route && b.method === method.toUpperCase()
      );
      if (idx >= 0) list.splice(idx, 1);
    },
  };
}
