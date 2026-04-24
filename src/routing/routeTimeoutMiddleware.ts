import { createRouteTimeoutTracker, RouteTimeoutTracker } from './routeTimeoutTracker';

export interface TimeoutMiddlewareOptions {
  timeoutMs?: number;
  resolveRoute?: (req: any) => string;
}

export interface RouteTimeoutMiddleware {
  middleware: (req: any, res: any, next: () => void) => void;
  getTracker: () => RouteTimeoutTracker;
  reset: () => void;
}

function defaultResolveRoute(req: any): string {
  return req.route?.path ?? req.path ?? req.url ?? 'unknown';
}

export function createRouteTimeoutMiddleware(
  options: TimeoutMiddlewareOptions = {}
): RouteTimeoutMiddleware {
  const { timeoutMs = 5000, resolveRoute = defaultResolveRoute } = options;
  const tracker = createRouteTimeoutTracker();

  function middleware(req: any, res: any, next: () => void): void {
    const route = resolveRoute(req);
    const method = req.method ?? 'GET';
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        tracker.record(method, route, true);
      }
    }, timeoutMs);

    const finish = () => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        tracker.record(method, route, false);
      }
    };

    res.on?.('finish', finish);
    res.on?.('close', finish);

    next();
  }

  return {
    middleware,
    getTracker: () => tracker,
    reset: () => tracker.reset(),
  };
}
