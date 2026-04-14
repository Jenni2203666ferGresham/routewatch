import { RouteMetric } from '../metrics/RouteMetrics';

export interface CorrelationEntry {
  traceId: string;
  route: string;
  method: string;
  statusCode: number;
  latencyMs: number;
  timestamp: number;
  tags: Record<string, string>;
}

export interface CorrelationTracker {
  record(traceId: string, metric: RouteMetric, tags?: Record<string, string>): void;
  getByTraceId(traceId: string): CorrelationEntry | undefined;
  getByRoute(route: string): CorrelationEntry[];
  getAll(): CorrelationEntry[];
  clear(): void;
  size(): number;
}

export function createCorrelationTracker(maxEntries = 1000): CorrelationTracker {
  const entries = new Map<string, CorrelationEntry>();
  const routeIndex = new Map<string, Set<string>>();

  function evictOldest(): void {
    const oldest = entries.keys().next().value;
    if (oldest) {
      const entry = entries.get(oldest)!;
      const routeSet = routeIndex.get(entry.route);
      routeSet?.delete(oldest);
      entries.delete(oldest);
    }
  }

  function record(traceId: string, metric: RouteMetric, tags: Record<string, string> = {}): void {
    if (entries.size >= maxEntries) evictOldest();

    const entry: CorrelationEntry = {
      traceId,
      route: metric.route,
      method: metric.method,
      statusCode: metric.statusCode,
      latencyMs: metric.latencyMs,
      timestamp: metric.timestamp,
      tags,
    };

    entries.set(traceId, entry);

    if (!routeIndex.has(metric.route)) routeIndex.set(metric.route, new Set());
    routeIndex.get(metric.route)!.add(traceId);
  }

  function getByTraceId(traceId: string): CorrelationEntry | undefined {
    return entries.get(traceId);
  }

  function getByRoute(route: string): CorrelationEntry[] {
    const ids = routeIndex.get(route);
    if (!ids) return [];
    return Array.from(ids).map(id => entries.get(id)!).filter(Boolean);
  }

  function getAll(): CorrelationEntry[] {
    return Array.from(entries.values());
  }

  function clear(): void {
    entries.clear();
    routeIndex.clear();
  }

  function size(): number {
    return entries.size;
  }

  return { record, getByTraceId, getByRoute, getAll, clear, size };
}
