import { checkCompliance, createRouteComplianceChecker, ComplianceRule } from './routeComplianceChecker';
import { RouteMetrics } from '../metrics/RouteMetrics';

function makeMetrics(overrides: Partial<RouteMetrics> = {}): RouteMetrics {
  return {
    requestCount: 10,
    errorCount: 0,
    latencies: [100, 120, 130, 140, 150],
    lastAccessedAt: Date.now(),
    ...overrides,
  } as RouteMetrics;
}

function makeMap(entries: [string, Partial<RouteMetrics>][]): Map<string, RouteMetrics> {
  return new Map(entries.map(([k, v]) => [k, makeMetrics(v)]));
}

describe('checkCompliance', () => {
  it('passes all rules for healthy metrics', () => {
    const map = makeMap([['GET:/api/users', {}]]);
    const summary = checkCompliance(map);
    expect(summary.failed).toBe(0);
    expect(summary.passed).toBe(summary.total);
  });

  it('fails error-rate rule when errors exceed 10%', () => {
    const map = makeMap([['GET:/api/users', { requestCount: 10, errorCount: 5 }]]);
    const summary = checkCompliance(map);
    const failed = summary.results.filter((r) => !r.passed && r.rule === 'error-rate');
    expect(failed.length).toBe(1);
  });

  it('fails max-latency rule when P99 exceeds 2000ms', () => {
    const latencies = Array.from({ length: 100 }, (_, i) => (i < 99 ? 100 : 3000));
    const map = makeMap([['POST:/api/slow', { latencies }]]);
    const summary = checkCompliance(map);
    const failed = summary.results.filter((r) => !r.passed && r.rule === 'max-latency');
    expect(failed.length).toBe(1);
  });

  it('fails min-requests rule when requestCount is 0', () => {
    const map = makeMap([['DELETE:/api/unused', { requestCount: 0, errorCount: 0 }]]);
    const summary = checkCompliance(map);
    const failed = summary.results.filter((r) => !r.passed && r.rule === 'min-requests');
    expect(failed.length).toBe(1);
  });

  it('handles empty metrics map', () => {
    const summary = checkCompliance(new Map());
    expect(summary.total).toBe(0);
    expect(summary.passed).toBe(0);
    expect(summary.failed).toBe(0);
  });

  it('supports custom rules', () => {
    const customRule: ComplianceRule = {
      name: 'always-fail',
      description: 'Always fails',
      check: () => false,
    };
    const map = makeMap([['GET:/health', {}]]);
    const summary = checkCompliance(map, [customRule]);
    expect(summary.failed).toBe(1);
    expect(summary.results[0].rule).toBe('always-fail');
  });
});

describe('createRouteComplianceChecker', () => {
  it('returns a checker with default rules', () => {
    const checker = createRouteComplianceChecker();
    expect(checker.getDefaultRules().length).toBeGreaterThan(0);
  });

  it('allows adding rules dynamically', () => {
    const checker = createRouteComplianceChecker([]);
    checker.addRule({ name: 'custom', description: 'test', check: () => true });
    const map = makeMap([['GET:/api/test', {}]]);
    const summary = checker.check(map);
    expect(summary.total).toBe(1);
    expect(summary.passed).toBe(1);
  });
});
