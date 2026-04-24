export interface AbTestVariant {
  name: string;
  weight: number;
}

export interface AbTestEntry {
  route: string;
  method: string;
  variants: Record<string, { hits: number; totalLatency: number; errors: number }>;
  createdAt: number;
  updatedAt: number;
}

export interface RouteAbTestTracker {
  register(route: string, method: string, variants: AbTestVariant[]): void;
  record(route: string, method: string, variant: string, latency: number, isError: boolean): void;
  getAll(): AbTestEntry[];
  getByRoute(route: string, method: string): AbTestEntry | undefined;
  getWinningVariant(route: string, method: string): string | undefined;
  reset(): void;
}

function makeKey(route: string, method: string): string {
  return `${method.toUpperCase()}:${route}`;
}

export function createRouteAbTestTracker(): RouteAbTestTracker {
  const store = new Map<string, AbTestEntry>();

  function register(route: string, method: string, variants: AbTestVariant[]): void {
    const key = makeKey(route, method);
    const variantMap: AbTestEntry["variants"] = {};
    for (const v of variants) {
      variantMap[v.name] = { hits: 0, totalLatency: 0, errors: 0 };
    }
    store.set(key, { route, method: method.toUpperCase(), variants: variantMap, createdAt: Date.now(), updatedAt: Date.now() });
  }

  function record(route: string, method: string, variant: string, latency: number, isError: boolean): void {
    const key = makeKey(route, method);
    const entry = store.get(key);
    if (!entry) return;
    if (!entry.variants[variant]) {
      entry.variants[variant] = { hits: 0, totalLatency: 0, errors: 0 };
    }
    entry.variants[variant].hits++;
    entry.variants[variant].totalLatency += latency;
    if (isError) entry.variants[variant].errors++;
    entry.updatedAt = Date.now();
  }

  function getAll(): AbTestEntry[] {
    return Array.from(store.values());
  }

  function getByRoute(route: string, method: string): AbTestEntry | undefined {
    return store.get(makeKey(route, method));
  }

  function getWinningVariant(route: string, method: string): string | undefined {
    const entry = store.get(makeKey(route, method));
    if (!entry) return undefined;
    let best: string | undefined;
    let bestScore = -Infinity;
    for (const [name, stats] of Object.entries(entry.variants)) {
      if (stats.hits === 0) continue;
      const avgLatency = stats.totalLatency / stats.hits;
      const errorRate = stats.errors / stats.hits;
      const score = -avgLatency - errorRate * 1000;
      if (score > bestScore) { bestScore = score; best = name; }
    }
    return best;
  }

  function reset(): void {
    store.clear();
  }

  return { register, record, getAll, getByRoute, getWinningVariant, reset };
}
