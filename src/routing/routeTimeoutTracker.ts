export interface TimeoutEntry {
  route: string;
  method: string;
  timeouts: number;
  total: number;
  timeoutRate: number;
  lastTimeoutAt: number | null;
}

interface TimeoutBucket {
  timeouts: number;
  total: number;
  lastTimeoutAt: number | null;
}

export interface RouteTimeoutTracker {
  record(method: string, route: string, timedOut: boolean): void;
  getAll(): TimeoutEntry[];
  getByRoute(route: string): TimeoutEntry[];
  getByMethod(method: string, route: string): TimeoutEntry | undefined;
  reset(): void;
}

function makeKey(method: string, route: string): string {
  return `${method.toUpperCase()}:${route}`;
}

function toEntry(method: string, route: string, bucket: TimeoutBucket): TimeoutEntry {
  return {
    route,
    method: method.toUpperCase(),
    timeouts: bucket.timeouts,
    total: bucket.total,
    timeoutRate: bucket.total > 0 ? bucket.timeouts / bucket.total : 0,
    lastTimeoutAt: bucket.lastTimeoutAt,
  };
}

export function createRouteTimeoutTracker(): RouteTimeoutTracker {
  const store = new Map<string, { method: string; route: string; bucket: TimeoutBucket }>();

  function ensure(method: string, route: string) {
    const key = makeKey(method, route);
    if (!store.has(key)) {
      store.set(key, { method, route, bucket: { timeouts: 0, total: 0, lastTimeoutAt: null } });
    }
    return store.get(key)!;
  }

  return {
    record(method, route, timedOut) {
      const entry = ensure(method, route);
      entry.bucket.total += 1;
      if (timedOut) {
        entry.bucket.timeouts += 1;
        entry.bucket.lastTimeoutAt = Date.now();
      }
    },

    getAll() {
      return Array.from(store.values()).map(({ method, route, bucket }) =>
        toEntry(method, route, bucket)
      );
    },

    getByRoute(route) {
      return Array.from(store.values())
        .filter((e) => e.route === route)
        .map(({ method, route: r, bucket }) => toEntry(method, r, bucket));
    },

    getByMethod(method, route) {
      const key = makeKey(method, route);
      const entry = store.get(key);
      if (!entry) return undefined;
      return toEntry(entry.method, entry.route, entry.bucket);
    },

    reset() {
      store.clear();
    },
  };
}
