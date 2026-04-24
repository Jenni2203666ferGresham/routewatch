export interface RedirectEntry {
  method: string;
  fromRoute: string;
  toRoute: string;
  statusCode: number;
  count: number;
  lastSeenAt: number;
}

export interface RouteRedirectTracker {
  record(method: string, from: string, to: string, statusCode: number): void;
  getAll(): RedirectEntry[];
  getByFromRoute(route: string): RedirectEntry[];
  getByToRoute(route: string): RedirectEntry[];
  getChains(): Array<string[]>;
  reset(): void;
}

function makeKey(method: string, from: string, to: string): string {
  return `${method.toUpperCase()}:${from}=>${to}`;
}

export function createRouteRedirectTracker(): RouteRedirectTracker {
  const entries = new Map<string, RedirectEntry>();

  function record(method: string, from: string, to: string, statusCode: number): void {
    const key = makeKey(method, from, to);
    const existing = entries.get(key);
    if (existing) {
      existing.count += 1;
      existing.lastSeenAt = Date.now();
    } else {
      entries.set(key, {
        method: method.toUpperCase(),
        fromRoute: from,
        toRoute: to,
        statusCode,
        count: 1,
        lastSeenAt: Date.now(),
      });
    }
  }

  function getAll(): RedirectEntry[] {
    return Array.from(entries.values());
  }

  function getByFromRoute(route: string): RedirectEntry[] {
    return getAll().filter((e) => e.fromRoute === route);
  }

  function getByToRoute(route: string): RedirectEntry[] {
    return getAll().filter((e) => e.toRoute === route);
  }

  function getChains(): Array<string[]> {
    const fromSet = new Set(getAll().map((e) => e.fromRoute));
    const toSet = new Set(getAll().map((e) => e.toRoute));
    const roots = Array.from(fromSet).filter((r) => !toSet.has(r));

    function buildChain(start: string, visited: Set<string>): string[] {
      if (visited.has(start)) return [start];
      visited.add(start);
      const nexts = getByFromRoute(start).map((e) => e.toRoute);
      if (nexts.length === 0) return [start];
      return [start, ...buildChain(nexts[0], visited)];
    }

    return roots.map((r) => buildChain(r, new Set()));
  }

  function reset(): void {
    entries.clear();
  }

  return { record, getAll, getByFromRoute, getByToRoute, getChains, reset };
}
