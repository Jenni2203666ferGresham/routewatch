export interface CacheEntry {
  route: string;
  method: string;
  hits: number;
  misses: number;
  hitRate: number;
  lastAccessed: number;
}

interface CacheRecord {
  hits: number;
  misses: number;
  lastAccessed: number;
}

function makeKey(method: string, route: string): string {
  return `${method.toUpperCase()}:${route}`;
}

function computeHitRate(hits: number, misses: number): number {
  const total = hits + misses;
  return total === 0 ? 0 : hits / total;
}

export function createRouteCacheTracker() {
  const store = new Map<string, CacheRecord>();

  function ensure(method: string, route: string): CacheRecord {
    const key = makeKey(method, route);
    if (!store.has(key)) {
      store.set(key, { hits: 0, misses: 0, lastAccessed: Date.now() });
    }
    return store.get(key)!;
  }

  function recordHit(method: string, route: string): void {
    const record = ensure(method, route);
    record.hits += 1;
    record.lastAccessed = Date.now();
  }

  function recordMiss(method: string, route: string): void {
    const record = ensure(method, route);
    record.misses += 1;
    record.lastAccessed = Date.now();
  }

  function getAll(): CacheEntry[] {
    return Array.from(store.entries()).map(([key, rec]) => {
      const [method, ...rest] = key.split(':');
      return {
        route: rest.join(':'),
        method,
        hits: rec.hits,
        misses: rec.misses,
        hitRate: computeHitRate(rec.hits, rec.misses),
        lastAccessed: rec.lastAccessed,
      };
    });
  }

  function getByRoute(route: string): CacheEntry[] {
    return getAll().filter((e) => e.route === route);
  }

  function reset(): void {
    store.clear();
  }

  return { recordHit, recordMiss, getAll, getByRoute, reset };
}

export type RouteCacheTracker = ReturnType<typeof createRouteCacheTracker>;
