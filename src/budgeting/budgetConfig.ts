import { LatencyBudget } from './latencyBudget';

export interface BudgetConfigInput {
  budgets?: Array<{
    route: string;
    method?: string;
    p50Ms?: number;
    p95Ms?: number;
    p99Ms?: number;
  }>;
}

export function buildBudgetConfig(input: BudgetConfigInput): LatencyBudget[] {
  if (!input.budgets || input.budgets.length === 0) return [];
  return input.budgets.map((b) => ({
    route: b.route,
    method: (b.method ?? 'GET').toUpperCase(),
    p50Ms: b.p50Ms ?? 200,
    p95Ms: b.p95Ms ?? 500,
    p99Ms: b.p99Ms ?? 1000,
  }));
}

export function validateBudgetConfig(input: BudgetConfigInput): string[] {
  const errors: string[] = [];
  for (const b of input.budgets ?? []) {
    if (!b.route || b.route.trim() === '') {
      errors.push('Each budget entry must have a non-empty route.');
    }
    if (b.p50Ms !== undefined && b.p50Ms <= 0)
      errors.push(`p50Ms must be positive for route ${b.route}`);
    if (b.p95Ms !== undefined && b.p95Ms <= 0)
      errors.push(`p95Ms must be positive for route ${b.route}`);
    if (b.p99Ms !== undefined && b.p99Ms <= 0)
      errors.push(`p99Ms must be positive for route ${b.route}`);
  }
  return errors;
}
