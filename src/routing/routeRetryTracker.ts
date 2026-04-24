export interface RetryEntry {
  route: string;
  method: string;
  totalRequests: number;
  totalRetries: number;
  maxRetriesSeen: number;
  lastRetryAt: number | null;
}

export interface RetryEvent {
  route: string;
  method: string;
  retryCount: number;
  timestamp?: number;
}

export interface RouteRetryTracker {
  record(event: RetryEvent): void;
  getAll(): RetryEntry[];
  getByRoute(route: string): RetryEntry[];
  getByMethod(method: string): RetryEntry[];
  getRetryRate(route: string, method: string): number;
  reset(): void;
}

function makeKey(route: string, method: string): string {
  return `${method.toUpperCase()}:${route}`;
}

function emptyEntry(route: string, method: string): RetryEntry {
  return {
    route,
    method: method.toUpperCase(),
    totalRequests: 0,
    totalRetries: 0,
    maxRetriesSeen: 0,
    lastRetryAt: null,
  };
}

export function createRouteRetryTracker(): RouteRetryTracker {
  const store = new Map<string, RetryEntry>();

  function ensure(route: string, method: string): RetryEntry {
    const key = makeKey(route, method);
    if (!store.has(key)) store.set(key, emptyEntry(route, method));
    return store.get(key)!;
  }

  function record(event: RetryEvent): void {
    const entry = ensure(event.route, event.method);
    entry.totalRequests += 1;
    if (event.retryCount > 0) {
      entry.totalRetries += event.retryCount;
      entry.lastRetryAt = event.timestamp ?? Date.now();
      if (event.retryCount > entry.maxRetriesSeen) {
        entry.maxRetriesSeen = event.retryCount;
      }
    }
  }

  function getAll(): RetryEntry[] {
    return Array.from(store.values());
  }

  function getByRoute(route: string): RetryEntry[] {
    return getAll().filter((e) => e.route === route);
  }

  function getByMethod(method: string): RetryEntry[] {
    return getAll().filter((e) => e.method === method.toUpperCase());
  }

  function getRetryRate(route: string, method: string): number {
    const key = makeKey(route, method);
    const entry = store.get(key);
    if (!entry || entry.totalRequests === 0) return 0;
    return entry.totalRetries / entry.totalRequests;
  }

  function reset(): void {
    store.clear();
  }

  return { record, getAll, getByRoute, getByMethod, getRetryRate, reset };
}
