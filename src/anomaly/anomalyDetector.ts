import { MetricsStore } from '../metrics/MetricsStore';
import { aggregateMetrics } from '../metrics/MetricsAggregator';

export interface AnomalyResult {
  route: string;
  method: string;
  type: 'latency_spike' | 'error_surge' | 'traffic_drop';
  value: number;
  baseline: number;
  severity: 'low' | 'medium' | 'high';
  detectedAt: number;
}

export interface AnomalyDetectorConfig {
  latencySpikeMultiplier: number;  // e.g. 2.0 = 2x baseline triggers anomaly
  errorSurgeThreshold: number;     // e.g. 0.5 = 50% error rate
  trafficDropThreshold: number;    // fraction of baseline below which is anomalous
  minRequestsForBaseline: number;
}

const DEFAULT_CONFIG: AnomalyDetectorConfig = {
  latencySpikeMultiplier: 2.0,
  errorSurgeThreshold: 0.5,
  trafficDropThreshold: 0.2,
  minRequestsForBaseline: 5,
};

export function detectAnomalies(
  current: MetricsStore,
  baseline: MetricsStore,
  config: Partial<AnomalyDetectorConfig> = {}
): AnomalyResult[] {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const results: AnomalyResult[] = [];
  const now = Date.now();

  const currentAgg = aggregateMetrics(current);
  const baselineAgg = aggregateMetrics(baseline);

  for (const [key, curr] of Object.entries(currentAgg)) {
    const base = baselineAgg[key];
    if (!base || base.count < cfg.minRequestsForBaseline) continue;

    const [method, route] = key.split(' ');

    // Latency spike detection
    if (curr.avgLatency > base.avgLatency * cfg.latencySpikeMultiplier) {
      const severity =
        curr.avgLatency > base.avgLatency * 4 ? 'high'
        : curr.avgLatency > base.avgLatency * 3 ? 'medium'
        : 'low';
      results.push({
        route, method, type: 'latency_spike',
        value: curr.avgLatency, baseline: base.avgLatency,
        severity, detectedAt: now,
      });
    }

    // Error surge detection
    if (curr.errorRate > cfg.errorSurgeThreshold && curr.errorRate > base.errorRate * 1.5) {
      const severity = curr.errorRate > 0.9 ? 'high' : curr.errorRate > 0.7 ? 'medium' : 'low';
      results.push({
        route, method, type: 'error_surge',
        value: curr.errorRate, baseline: base.errorRate,
        severity, detectedAt: now,
      });
    }

    // Traffic drop detection
    if (curr.count < base.count * cfg.trafficDropThreshold && base.count >= cfg.minRequestsForBaseline) {
      results.push({
        route, method, type: 'traffic_drop',
        value: curr.count, baseline: base.count,
        severity: 'medium', detectedAt: now,
      });
    }
  }

  return results;
}
