export interface QuotaEntry {
  route: string;
  method: string;
  limit: number;
  used: number;
  remaining: number;
  resetAt: number;
  exceeded: boolean;
}

interface QuotaBucket {
  used: number;
  resetAt: number;
}

export interface RouteQuotaTracker {
  configure(route: string, method: string, limit: number, windowMs: number): void;
  record(route: string, method: string): void;
  getAll(): QuotaEntry[];
  getByRoute(route: string): QuotaEntry[];
  isExceeded(route: string, method: string): boolean;
  reset(route: string, method: string): void;
  resetAll(): void;
}

function makeKey(route: string, method: string): string {
  return `${method.toUpperCase()}:${route}`;
}

export function createRouteQuotaTracker(): RouteQuotaTracker {
  const limits = new Map<string, { limit: number; windowMs: number }>();
  const buckets = new Map<string, QuotaBucket>();

  function getOrCreate(key: string, windowMs: number): QuotaBucket {
    const now = Date.now();
    let bucket = buckets.get(key);
    if (!bucket || now >= bucket.resetAt) {
      bucket = { used: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }
    return bucket;
  }

  function configure(route: string, method: string, limit: number, windowMs: number): void {
    limits.set(makeKey(route, method), { limit, windowMs });
  }

  function record(route: string, method: string): void {
    const key = makeKey(route, method);
    const cfg = limits.get(key);
    if (!cfg) return;
    const bucket = getOrCreate(key, cfg.windowMs);
    bucket.used += 1;
  }

  function toEntry(route: string, method: string): QuotaEntry {
    const key = makeKey(route, method);
    const cfg = limits.get(key)!;
    const bucket = getOrCreate(key, cfg.windowMs);
    const remaining = Math.max(0, cfg.limit - bucket.used);
    return {
      route,
      method: method.toUpperCase(),
      limit: cfg.limit,
      used: bucket.used,
      remaining,
      resetAt: bucket.resetAt,
      exceeded: bucket.used > cfg.limit,
    };
  }

  function getAll(): QuotaEntry[] {
    return Array.from(limits.keys()).map((key) => {
      const [method, ...rest] = key.split(':');
      return toEntry(rest.join(':'), method);
    });
  }

  function getByRoute(route: string): QuotaEntry[] {
    return getAll().filter((e) => e.route === route);
  }

  function isExceeded(route: string, method: string): boolean {
    const key = makeKey(route, method);
    const cfg = limits.get(key);
    if (!cfg) return false;
    const bucket = getOrCreate(key, cfg.windowMs);
    return bucket.used > cfg.limit;
  }

  function reset(route: string, method: string): void {
    buckets.delete(makeKey(route, method));
  }

  function resetAll(): void {
    buckets.clear();
  }

  return { configure, record, getAll, getByRoute, isExceeded, reset, resetAll };
}
