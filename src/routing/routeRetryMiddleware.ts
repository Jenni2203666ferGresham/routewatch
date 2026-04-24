import { createRouteRetryTracker, RouteRetryTracker } from './routeRetryTracker';

export interface RetryMiddlewareOptions {
  resolveRoute?: (req: any) => string;
  resolveRetryCount?: (req: any) => number;
}

export interface RetryMiddlewareHandle {
  middleware: (req: any, res: any, next: () => void) => void;
  getTracker: () => RouteRetryTracker;
  reset: () => void;
}

function defaultResolveRoute(req: any): string {
  return req.route?.path ?? req.path ?? req.url ?? 'unknown';
}

function defaultResolveRetryCount(req: any): number {
  const header = req.headers?.['x-retry-count'];
  if (!header) return 0;
  const parsed = parseInt(String(header), 10);
  return isNaN(parsed) ? 0 : parsed;
}

export function createRouteRetryMiddleware(
  options: RetryMiddlewareOptions = {}
): RetryMiddlewareHandle {
  const tracker = createRouteRetryTracker();
  const resolveRoute = options.resolveRoute ?? defaultResolveRoute;
  const resolveRetryCount = options.resolveRetryCount ?? defaultResolveRetryCount;

  function middleware(req: any, _res: any, next: () => void): void {
    const route = resolveRoute(req);
    const method = req.method ?? 'GET';
    const retryCount = resolveRetryCount(req);
    tracker.record({ route, method, retryCount, timestamp: Date.now() });
    next();
  }

  function getTracker(): RouteRetryTracker {
    return tracker;
  }

  function reset(): void {
    tracker.reset();
  }

  return { middleware, getTracker, reset };
}
