/**
 * Tracks request and response payload sizes per route.
 */

export interface PayloadStats {
  route: string;
  method: string;
  requestSizeBytes: { total: number; count: number; max: number; avg: number };
  responseSizeBytes: { total: number; count: number; max: number; avg: number };
}

interface Entry {
  reqTotal: number;
  reqCount: number;
  reqMax: number;
  resTotal: number;
  resCount: number;
  resMax: number;
}

function makeKey(route: string, method: string): string {
  return `${method.toUpperCase()}::${route}`;
}

export function createRoutePayloadTracker() {
  const store = new Map<string, Entry>();

  function ensure(route: string, method: string): Entry {
    const key = makeKey(route, method);
    if (!store.has(key)) {
      store.set(key, { reqTotal: 0, reqCount: 0, reqMax: 0, resTotal: 0, resCount: 0, resMax: 0 });
    }
    return store.get(key)!;
  }

  function record(route: string, method: string, requestBytes: number, responseBytes: number): void {
    const entry = ensure(route, method);
    entry.reqTotal += requestBytes;
    entry.reqCount += 1;
    if (requestBytes > entry.reqMax) entry.reqMax = requestBytes;
    entry.resTotal += responseBytes;
    entry.resCount += 1;
    if (responseBytes > entry.resMax) entry.resMax = responseBytes;
  }

  function getAll(): PayloadStats[] {
    return Array.from(store.entries()).map(([key, e]) => {
      const [method, route] = key.split(/::(.*)/s).filter(Boolean);
      return {
        route,
        method,
        requestSizeBytes: {
          total: e.reqTotal,
          count: e.reqCount,
          max: e.reqMax,
          avg: e.reqCount > 0 ? Math.round(e.reqTotal / e.reqCount) : 0,
        },
        responseSizeBytes: {
          total: e.resTotal,
          count: e.resCount,
          max: e.resMax,
          avg: e.resCount > 0 ? Math.round(e.resTotal / e.resCount) : 0,
        },
      };
    });
  }

  function getByRoute(route: string): PayloadStats[] {
    return getAll().filter((s) => s.route === route);
  }

  function reset(): void {
    store.clear();
  }

  return { record, getAll, getByRoute, reset };
}

export type RoutePayloadTracker = ReturnType<typeof createRoutePayloadTracker>;
