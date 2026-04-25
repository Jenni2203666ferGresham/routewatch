/**
 * Tracks HTTP status code distributions per route+method.
 * Provides counts, percentages, and success/failure breakdowns.
 */

export interface RouteStatusEntry {
  route: string;
  method: string;
  statusCounts: Record<number, number>;
  total: number;
  successRate: number; // 2xx / total
  clientErrorRate: number; // 4xx / total
  serverErrorRate: number; // 5xx / total
}

interface InternalEntry {
  statusCounts: Map<number, number>;
  total: number;
}

function makeKey(method: string, route: string): string {
  return `${method.toUpperCase()}::${route}`;
}

function computeRate(counts: Map<number, number>, total: number, min: number, max: number): number {
  if (total === 0) return 0;
  let sum = 0;
  for (const [code, count] of counts) {
    if (code >= min && code < max) sum += count;
  }
  return sum / total;
}

function toEntry(method: string, route: string, internal: InternalEntry): RouteStatusEntry {
  const statusCounts: Record<number, number> = {};
  for (const [code, count] of internal.statusCounts) {
    statusCounts[code] = count;
  }
  return {
    route,
    method: method.toUpperCase(),
    statusCounts,
    total: internal.total,
    successRate: computeRate(internal.statusCounts, internal.total, 200, 300),
    clientErrorRate: computeRate(internal.statusCounts, internal.total, 400, 500),
    serverErrorRate: computeRate(internal.statusCounts, internal.total, 500, 600),
  };
}

export interface RouteStatusTracker {
  record(method: string, route: string, statusCode: number): void;
  getAll(): RouteStatusEntry[];
  getByRoute(route: string): RouteStatusEntry[];
  getByMethod(method: string): RouteStatusEntry[];
  get(method: string, route: string): RouteStatusEntry | undefined;
  reset(): void;
}

export function createRouteStatusTracker(): RouteStatusTracker {
  const store = new Map<string, { method: string; route: string; data: InternalEntry }>();

  function ensure(method: string, route: string) {
    const key = makeKey(method, route);
    if (!store.has(key)) {
      store.set(key, { method: method.toUpperCase(), route, data: { statusCounts: new Map(), total: 0 } });
    }
    return store.get(key)!;
  }

  return {
    record(method, route, statusCode) {
      const entry = ensure(method, route);
      entry.data.statusCounts.set(statusCode, (entry.data.statusCounts.get(statusCode) ?? 0) + 1);
      entry.data.total += 1;
    },

    getAll() {
      return [...store.values()].map(({ method, route, data }) => toEntry(method, route, data));
    },

    getByRoute(route) {
      return [...store.values()]
        .filter((e) => e.route === route)
        .map(({ method, route: r, data }) => toEntry(method, r, data));
    },

    getByMethod(method) {
      const upper = method.toUpperCase();
      return [...store.values()]
        .filter((e) => e.method === upper)
        .map(({ method: m, route, data }) => toEntry(m, route, data));
    },

    get(method, route) {
      const key = makeKey(method, route);
      const entry = store.get(key);
      if (!entry) return undefined;
      return toEntry(entry.method, entry.route, entry.data);
    },

    reset() {
      store.clear();
    },
  };
}
