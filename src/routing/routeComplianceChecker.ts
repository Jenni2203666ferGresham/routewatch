import { RouteMetrics } from '../metrics/RouteMetrics';

export interface ComplianceRule {
  name: string;
  description: string;
  check: (metrics: RouteMetrics) => boolean;
}

export interface ComplianceResult {
  route: string;
  method: string;
  rule: string;
  description: string;
  passed: boolean;
}

export interface ComplianceSummary {
  total: number;
  passed: number;
  failed: number;
  results: ComplianceResult[];
}

const DEFAULT_RULES: ComplianceRule[] = [
  {
    name: 'max-latency',
    description: 'P99 latency must be below 2000ms',
    check: (m) => {
      const sorted = [...m.latencies].sort((a, b) => a - b);
      if (sorted.length === 0) return true;
      const idx = Math.ceil(0.99 * sorted.length) - 1;
      return sorted[idx] < 2000;
    },
  },
  {
    name: 'error-rate',
    description: 'Error rate must be below 10%',
    check: (m) => {
      if (m.requestCount === 0) return true;
      return m.errorCount / m.requestCount < 0.1;
    },
  },
  {
    name: 'min-requests',
    description: 'Route must have been called at least once',
    check: (m) => m.requestCount > 0,
  },
];

export function checkCompliance(
  metricsMap: Map<string, RouteMetrics>,
  rules: ComplianceRule[] = DEFAULT_RULES
): ComplianceSummary {
  const results: ComplianceResult[] = [];

  for (const [key, metrics] of metricsMap.entries()) {
    const [method, route] = key.split(':');
    for (const rule of rules) {
      const passed = rule.check(metrics);
      results.push({ route, method, rule: rule.name, description: rule.description, passed });
    }
  }

  const passed = results.filter((r) => r.passed).length;
  return { total: results.length, passed, failed: results.length - passed, results };
}

export function createRouteComplianceChecker(rules: ComplianceRule[] = DEFAULT_RULES) {
  return {
    check: (metricsMap: Map<string, RouteMetrics>) => checkCompliance(metricsMap, rules),
    getDefaultRules: () => DEFAULT_RULES,
    addRule: (rule: ComplianceRule) => {
      rules = [...rules, rule];
    },
  };
}
