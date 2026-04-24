export interface AuthEvent {
  method: string;
  route: string;
  authenticated: boolean;
  userId?: string;
  timestamp: number;
}

export interface AuthStats {
  method: string;
  route: string;
  total: number;
  authenticated: number;
  unauthenticated: number;
  authRate: number;
  uniqueUsers: Set<string>;
}

function makeKey(method: string, route: string): string {
  return `${method.toUpperCase()}::${route}`;
}

export interface RouteAuthTracker {
  record(event: AuthEvent): void;
  getAll(): AuthStats[];
  getByRoute(method: string, route: string): AuthStats | undefined;
  getUnauthenticated(): AuthStats[];
  reset(): void;
}

export function createRouteAuthTracker(): RouteAuthTracker {
  const store = new Map<string, AuthStats>();

  function ensure(method: string, route: string): AuthStats {
    const key = makeKey(method, route);
    if (!store.has(key)) {
      store.set(key, {
        method: method.toUpperCase(),
        route,
        total: 0,
        authenticated: 0,
        unauthenticated: 0,
        authRate: 0,
        uniqueUsers: new Set(),
      });
    }
    return store.get(key)!;
  }

  function record(event: AuthEvent): void {
    const stats = ensure(event.method, event.route);
    stats.total += 1;
    if (event.authenticated) {
      stats.authenticated += 1;
      if (event.userId) {
        stats.uniqueUsers.add(event.userId);
      }
    } else {
      stats.unauthenticated += 1;
    }
    stats.authRate = stats.total > 0 ? stats.authenticated / stats.total : 0;
  }

  function getAll(): AuthStats[] {
    return Array.from(store.values());
  }

  function getByRoute(method: string, route: string): AuthStats | undefined {
    return store.get(makeKey(method, route));
  }

  function getUnauthenticated(): AuthStats[] {
    return getAll().filter((s) => s.unauthenticated > 0);
  }

  function reset(): void {
    store.clear();
  }

  return { record, getAll, getByRoute, getUnauthenticated, reset };
}
