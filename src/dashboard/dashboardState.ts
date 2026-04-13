import { MetricsStore } from '../metrics/MetricsStore';
import { aggregateMetrics, getSlowestRoutes, getHighestErrorRoutes } from '../metrics/MetricsAggregator';
import { AlertPipelineHandle } from '../alerts/alertPipeline';

export interface DashboardState {
  store: MetricsStore;
  topN: number;
  refreshIntervalMs: number;
  alertPipeline?: AlertPipelineHandle;
  lastUpdated: Date;
}

export interface DashboardSnapshot {
  rows: Array<{
    route: string;
    method: string;
    count: number;
    p50: number;
    p95: number;
    p99: number;
    errorRate: number;
  }>;
  slowestRoutes: string[];
  highestErrorRoutes: string[];
  lastUpdated: Date;
  activeAlerts: string[];
}

export function createDashboardState(
  store: MetricsStore,
  options: { topN?: number; refreshIntervalMs?: number; alertPipeline?: AlertPipelineHandle } = {}
): DashboardState {
  return {
    store,
    topN: options.topN ?? 10,
    refreshIntervalMs: options.refreshIntervalMs ?? 2000,
    alertPipeline: options.alertPipeline,
    lastUpdated: new Date(),
  };
}

export function snapshotDashboard(state: DashboardState): DashboardSnapshot {
  const { store, topN } = state;
  const allRoutes = store.getRoutes();

  const rows = allRoutes.map((key) => {
    const [method, route] = key.split(' ');
    const agg = aggregateMetrics(store, route, method);
    return {
      route,
      method,
      count: agg.count,
      p50: agg.p50,
      p95: agg.p95,
      p99: agg.p99,
      errorRate: agg.errorRate,
    };
  });

  const slowestRoutes = getSlowestRoutes(store, topN);
  const highestErrorRoutes = getHighestErrorRoutes(store, topN);

  const activeAlerts = state.alertPipeline
    ? state.alertPipeline.getActiveAlerts().map((a) => a.message)
    : [];

  return {
    rows,
    slowestRoutes,
    highestErrorRoutes,
    lastUpdated: new Date(),
    activeAlerts,
  };
}
