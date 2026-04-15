import { MetricsStore } from '../metrics/MetricsStore';
import { aggregateMetrics } from '../metrics/MetricsAggregator';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  totalRequests: number;
  errorRate: number;
  avgLatencyMs: number;
  routeCount: number;
  checkedAt: string;
}

export interface HealthCheckConfig {
  degradedErrorRateThreshold: number;
  unhealthyErrorRateThreshold: number;
  degradedLatencyMs: number;
  unhealthyLatencyMs: number;
}

const DEFAULT_CONFIG: HealthCheckConfig = {
  degradedErrorRateThreshold: 0.05,
  unhealthyErrorRateThreshold: 0.2,
  degradedLatencyMs: 500,
  unhealthyLatencyMs: 2000,
};

export function checkHealth(
  store: MetricsStore,
  startTime: number,
  config: Partial<HealthCheckConfig> = {}
): HealthStatus {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const routes = store.getAll();
  const routeKeys = Object.keys(routes);

  let totalRequests = 0;
  let totalErrors = 0;
  let totalLatency = 0;

  for (const key of routeKeys) {
    const agg = aggregateMetrics(routes[key]);
    totalRequests += agg.count;
    totalErrors += Math.round(agg.count * agg.errorRate);
    totalLatency += agg.avgLatency * agg.count;
  }

  const errorRate = totalRequests > 0 ? totalErrors / totalRequests : 0;
  const avgLatencyMs = totalRequests > 0 ? totalLatency / totalRequests : 0;

  let status: HealthStatus['status'] = 'healthy';
  if (errorRate >= cfg.unhealthyErrorRateThreshold || avgLatencyMs >= cfg.unhealthyLatencyMs) {
    status = 'unhealthy';
  } else if (errorRate >= cfg.degradedErrorRateThreshold || avgLatencyMs >= cfg.degradedLatencyMs) {
    status = 'degraded';
  }

  return {
    status,
    uptime: Date.now() - startTime,
    totalRequests,
    errorRate,
    avgLatencyMs,
    routeCount: routeKeys.length,
    checkedAt: new Date().toISOString(),
  };
}
