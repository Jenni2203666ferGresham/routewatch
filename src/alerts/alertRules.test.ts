import { evaluateAlerts, DEFAULT_RULES, AlertRule, AlertEvent } from './alertRules';
import { AggregatedMetrics } from '../metrics/MetricsAggregator';

function buildMetrics(overrides: Partial<AggregatedMetrics> = {}): AggregatedMetrics {
  return {
    route: 'GET /api/test',
    count: 100,
    avgLatency: 120,
    p95Latency: 200,
    p99Latency: 300,
    errorRate: 0.02,
    ...overrides,
  };
}

describe('evaluateAlerts', () => {
  it('returns no alerts for healthy metrics', () => {
    const metrics = [buildMetrics()];
    const alerts = evaluateAlerts(metrics);
    expect(alerts).toHaveLength(0);
  });

  it('fires warn alert when p95 latency exceeds 500ms', () => {
    const metrics = [buildMetrics({ p95Latency: 600 })];
    const alerts = evaluateAlerts(metrics);
    const latencyAlert = alerts.find((a) => a.rule === 'high-latency');
    expect(latencyAlert).toBeDefined();
    expect(latencyAlert?.severity).toBe('warn');
    expect(latencyAlert?.route).toBe('GET /api/test');
  });

  it('fires critical alert when p95 latency exceeds 2000ms', () => {
    const metrics = [buildMetrics({ p95Latency: 2500 })];
    const alerts = evaluateAlerts(metrics);
    const critical = alerts.find((a) => a.rule === 'critical-latency');
    expect(critical).toBeDefined();
    expect(critical?.severity).toBe('critical');
  });

  it('fires warn alert when error rate exceeds 10%', () => {
    const metrics = [buildMetrics({ errorRate: 0.15 })];
    const alerts = evaluateAlerts(metrics);
    const errAlert = alerts.find((a) => a.rule === 'high-error-rate');
    expect(errAlert).toBeDefined();
    expect(errAlert?.severity).toBe('warn');
  });

  it('fires critical alert when error rate exceeds 50%', () => {
    const metrics = [buildMetrics({ errorRate: 0.75 })];
    const alerts = evaluateAlerts(metrics);
    const critical = alerts.find((a) => a.rule === 'critical-error-rate');
    expect(critical).toBeDefined();
    expect(critical?.severity).toBe('critical');
  });

  it('includes a timestamp on each alert event', () => {
    const before = new Date();
    const metrics = [buildMetrics({ p95Latency: 3000 })];
    const alerts = evaluateAlerts(metrics);
    const after = new Date();
    for (const alert of alerts) {
      expect(alert.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(alert.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    }
  });

  it('respects custom rules passed in', () => {
    const customRule: AlertRule = {
      name: 'low-traffic',
      severity: 'warn',
      check: (m) => m.count < 10,
      message: (m) => `Low traffic on ${m.route}`,
    };
    const metrics = [buildMetrics({ count: 5 })];
    const alerts = evaluateAlerts(metrics, [customRule]);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].rule).toBe('low-traffic');
  });

  it('handles multiple routes independently', () => {
    const metrics = [
      buildMetrics({ route: 'GET /healthy', p95Latency: 100 }),
      buildMetrics({ route: 'GET /slow', p95Latency: 1000 }),
    ];
    const alerts = evaluateAlerts(metrics);
    expect(alerts.every((a) => a.route === 'GET /slow')).toBe(true);
  });
});
