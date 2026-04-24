import { createRouteCacheTracker, RouteCacheTracker } from './routeCacheTracker';

export interface CacheMiddlewareOptions {
  /** Header name indicating cache status, default: 'x-cache' */
  cacheHeader?: string;
  /** Value that means HIT */
  hitValue?: string;
  /** Value that means MISS */
  missValue?: string;
}

const DEFAULT_HEADER = 'x-cache';
const DEFAULT_HIT = 'HIT';
const DEFAULT_MISS = 'MISS';

function resolveRoute(req: { path?: string; url?: string }): string {
  return req.path ?? req.url ?? 'unknown';
}

export function createRouteCacheMiddleware(options: CacheMiddlewareOptions = {}) {
  const tracker: RouteCacheTracker = createRouteCacheTracker();
  const header = options.cacheHeader ?? DEFAULT_HEADER;
  const hitValue = options.hitValue ?? DEFAULT_HIT;
  const missValue = options.missValue ?? DEFAULT_MISS;

  function middleware(
    req: { method?: string; path?: string; url?: string; headers?: Record<string, string> },
    _res: unknown,
    next: () => void
  ): void {
    const method = req.method ?? 'GET';
    const route = resolveRoute(req);
    const cacheStatus = (req.headers ?? {})[header.toLowerCase()];

    if (cacheStatus === hitValue) {
      tracker.recordHit(method, route);
    } else if (cacheStatus === missValue) {
      tracker.recordMiss(method, route);
    }

    next();
  }

  function getTracker(): RouteCacheTracker {
    return tracker;
  }

  function reset(): void {
    tracker.reset();
  }

  return { middleware, getTracker, reset };
}
