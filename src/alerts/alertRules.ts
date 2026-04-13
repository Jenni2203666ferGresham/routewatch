import { AggregatedMetrics } from '../metrics/MetricsAggregator';

export type AlertSeverity = 'warn' | 'critical';

export interface AlertRule {
  name: string;
  severity: AlertSeverity;
  check: (metrics: AggregatedMetrics) => boolean;
  message: (metrics: AggregatedMetrics) => string;
}

export interface AlertEvent {
  rule: string;
  severity: AlertSeverity;
  route: string;
  message: string;
  timestamp: Date;
}

export const DEFAULT_RULES: AlertRule[] = [
  {
    name: 'high-latency',
    severity: 'warn',
    check: (m) => m.p95Latency > 500,
    message: (m) => `High p95 latency: ${m.p95Latency.toFixed(1)}ms on ${m.route}`,
  },
  {
    name: 'critical-latency',
    severity: 'critical',
    check: (m) => m.p95Latency > 2000,
    message: (m) => `Critical p95 latency: ${m.p95Latency.toFixed(1)}ms on ${m.route}`,
  },
  {
    name: 'high-error-rate',
    severity: 'warn',
    check: (m) => m.errorRate > 0.1,
    message: (m) => `High error rate: ${(m.errorRate * 100).toFixed(1)}% on ${m.route}`,
  },
  {
    name: 'critical-error-rate',
    severity: 'critical',
    check: (m) => m.errorRate > 0.5,
    message: (m) => `Critical error rate: ${(m.errorRate * 100).toFixed(1)}% on ${m.route}`,
  },
];

export function evaluateAlerts(
  metricsList: AggregatedMetrics[],
  rules: AlertRule[] = DEFAULT_RULES
): AlertEvent[] {
  const events: AlertEvent[] = [];

  for (const metrics of metricsList) {
    for (const rule of rules) {
      if (rule.check(metrics)) {
        events.push({
          rule: rule.name,
          severity: rule.severity,
          route: metrics.route,
          message: rule.message(metrics),
          timestamp: new Date(),
        });
      }
    }
  }

  return events;
}
