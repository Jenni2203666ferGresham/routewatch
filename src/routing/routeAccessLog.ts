import { MetricsStore } from '../metrics/MetricsStore';

export interface AccessLogEntry {
  route: string;
  method: string;
  statusCode: number;
  latencyMs: number;
  timestamp: number;
  traceId?: string;
}

export interface RouteAccessLog {
  record(entry: AccessLogEntry): void;
  getAll(): AccessLogEntry[];
  getByRoute(route: string): AccessLogEntry[];
  getByMethod(method: string): AccessLogEntry[];
  getByStatusCode(code: number): AccessLogEntry[];
  getSince(timestampMs: number): AccessLogEntry[];
  clear(): void;
  size(): number;
}

export function createRouteAccessLog(maxEntries = 1000): RouteAccessLog {
  const entries: AccessLogEntry[] = [];

  function record(entry: AccessLogEntry): void {
    entries.push({ ...entry });
    if (entries.length > maxEntries) {
      entries.shift();
    }
  }

  function getAll(): AccessLogEntry[] {
    return [...entries];
  }

  function getByRoute(route: string): AccessLogEntry[] {
    return entries.filter((e) => e.route === route);
  }

  function getByMethod(method: string): AccessLogEntry[] {
    return entries.filter((e) => e.method.toUpperCase() === method.toUpperCase());
  }

  function getByStatusCode(code: number): AccessLogEntry[] {
    return entries.filter((e) => e.statusCode === code);
  }

  function getSince(timestampMs: number): AccessLogEntry[] {
    return entries.filter((e) => e.timestamp >= timestampMs);
  }

  function clear(): void {
    entries.length = 0;
  }

  function size(): number {
    return entries.length;
  }

  return { record, getAll, getByRoute, getByMethod, getByStatusCode, getSince, clear, size };
}

export function buildAccessLogFromStore(
  store: MetricsStore,
  maxEntries = 1000
): RouteAccessLog {
  const log = createRouteAccessLog(maxEntries);
  const all = store.getAll();
  for (const metric of all) {
    log.record({
      route: metric.route,
      method: metric.method,
      statusCode: metric.statusCode,
      latencyMs: metric.latencyMs,
      timestamp: metric.timestamp,
    });
  }
  return log;
}
