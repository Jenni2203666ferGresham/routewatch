export interface ResponseCodeEntry {
  route: string;
  method: string;
  statusCode: number;
  count: number;
  lastSeen: number;
}

export interface RouteResponseCodeTracker {
  record(method: string, route: string, statusCode: number): void;
  getAll(): ResponseCodeEntry[];
  getByRoute(method: string, route: string): ResponseCodeEntry[];
  getByStatusCode(statusCode: number): ResponseCodeEntry[];
  getSummary(method: string, route: string): Record<number, number>;
  reset(): void;
}

function makeKey(method: string, route: string, statusCode: number): string {
  return `${method.toUpperCase()}:${route}:${statusCode}`;
}

export function createRouteResponseCodeTracker(): RouteResponseCodeTracker {
  const store = new Map<string, ResponseCodeEntry>();

  function record(method: string, route: string, statusCode: number): void {
    const key = makeKey(method, route, statusCode);
    const existing = store.get(key);
    if (existing) {
      existing.count += 1;
      existing.lastSeen = Date.now();
    } else {
      store.set(key, {
        route,
        method: method.toUpperCase(),
        statusCode,
        count: 1,
        lastSeen: Date.now(),
      });
    }
  }

  function getAll(): ResponseCodeEntry[] {
    return Array.from(store.values());
  }

  function getByRoute(method: string, route: string): ResponseCodeEntry[] {
    const prefix = `${method.toUpperCase()}:${route}:`;
    return Array.from(store.values()).filter(
      (e) => e.method === method.toUpperCase() && e.route === route
    );
  }

  function getByStatusCode(statusCode: number): ResponseCodeEntry[] {
    return Array.from(store.values()).filter((e) => e.statusCode === statusCode);
  }

  function getSummary(method: string, route: string): Record<number, number> {
    const entries = getByRoute(method, route);
    const summary: Record<number, number> = {};
    for (const entry of entries) {
      summary[entry.statusCode] = (summary[entry.statusCode] ?? 0) + entry.count;
    }
    return summary;
  }

  function reset(): void {
    store.clear();
  }

  return { record, getAll, getByRoute, getByStatusCode, getSummary, reset };
}
