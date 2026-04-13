import { RouteMetrics } from './RouteMetrics';

export interface RouteSnapshot {
  route: string;
  method: string;
  metrics: {
    count: number;
    errorCount: number;
    avgLatency: number;
    p95Latency: number;
    errorRate: number;
  };
}

export class MetricsStore {
  private store: Map<string, RouteMetrics> = new Map();

  private getKey(method: string, route: string): string {
    return `${method.toUpperCase()}:${route}`;
  }

  record(method: string, route: string, latencyMs: number, isError: boolean): void {
    const key = this.getKey(method, route);
    if (!this.store.has(key)) {
      this.store.set(key, new RouteMetrics(method, route));
    }
    this.store.get(key)!.record(latencyMs, isError);
  }

  getSnapshot(): RouteSnapshot[] {
    return Array.from(this.store.values()).map((rm) => ({
      route: rm.route,
      method: rm.method,
      metrics: {
        count: rm.count,
        errorCount: rm.errorCount,
        avgLatency: rm.avgLatency,
        p95Latency: rm.p95Latency,
        errorRate: rm.errorRate,
      },
    }));
  }

  getRouteMetrics(method: string, route: string): RouteMetrics | undefined {
    return this.store.get(this.getKey(method, route));
  }

  reset(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }
}

export const globalMetricsStore = new MetricsStore();
