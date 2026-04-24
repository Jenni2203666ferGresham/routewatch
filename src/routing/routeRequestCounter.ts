export interface RouteRequestCounterEntry {
  route: string;
  method: string;
  count: number;
  lastSeenAt: number;
}

export interface RouteRequestCounter {
  record(method: string, route: string): void;
  getAll(): RouteRequestCounterEntry[];
  getByRoute(route: string): RouteRequestCounterEntry[];
  getByMethod(method: string): RouteRequestCounterEntry[];
  getCount(method: string, route: string): number;
  reset(): void;
}

function makeKey(method: string, route: string): string {
  return `${method.toUpperCase()}::${route}`;
}

export function createRouteRequestCounter(): RouteRequestCounter {
  const store = new Map<string, RouteRequestCounterEntry>();

  function record(method: string, route: string): void {
    const key = makeKey(method, route);
    const existing = store.get(key);
    if (existing) {
      existing.count += 1;
      existing.lastSeenAt = Date.now();
    } else {
      store.set(key, {
        route,
        method: method.toUpperCase(),
        count: 1,
        lastSeenAt: Date.now(),
      });
    }
  }

  function getAll(): RouteRequestCounterEntry[] {
    return Array.from(store.values());
  }

  function getByRoute(route: string): RouteRequestCounterEntry[] {
    return getAll().filter((e) => e.route === route);
  }

  function getByMethod(method: string): RouteRequestCounterEntry[] {
    return getAll().filter((e) => e.method === method.toUpperCase());
  }

  function getCount(method: string, route: string): number {
    return store.get(makeKey(method, route))?.count ?? 0;
  }

  function reset(): void {
    store.clear();
  }

  return { record, getAll, getByRoute, getByMethod, getCount, reset };
}
