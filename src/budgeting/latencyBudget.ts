export interface LatencyBudget {
  route: string;
  method: string;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
}

export interface BudgetViolation {
  route: string;
  method: string;
  percentile: 'p50' | 'p95' | 'p99';
  budgetMs: number;
  actualMs: number;
  exceededBy: number;
}

export function checkBudget(
  budget: LatencyBudget,
  actual: { p50: number; p95: number; p99: number }
): BudgetViolation[] {
  const violations: BudgetViolation[] = [];
  const checks: Array<['p50' | 'p95' | 'p99', number, number]> = [
    ['p50', budget.p50Ms, actual.p50],
    ['p95', budget.p95Ms, actual.p95],
    ['p99', budget.p99Ms, actual.p99],
  ];
  for (const [percentile, budgetMs, actualMs] of checks) {
    if (actualMs > budgetMs) {
      violations.push({
        route: budget.route,
        method: budget.method,
        percentile,
        budgetMs,
        actualMs,
        exceededBy: parseFloat((actualMs - budgetMs).toFixed(2)),
      });
    }
  }
  return violations;
}

export function evaluateBudgets(
  budgets: LatencyBudget[],
  actuals: Map<string, { p50: number; p95: number; p99: number }>
): BudgetViolation[] {
  const all: BudgetViolation[] = [];
  for (const budget of budgets) {
    const key = `${budget.method.toUpperCase()}:${budget.route}`;
    const actual = actuals.get(key);
    if (actual) {
      all.push(...checkBudget(budget, actual));
    }
  }
  return all;
}
