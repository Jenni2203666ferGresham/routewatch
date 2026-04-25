import { IncomingMessage, ServerResponse } from 'http';
import { createRouteQuotaTracker, RouteQuotaTracker } from './routeQuotaTracker';

export interface QuotaMiddlewareOptions {
  routes: Array<{ route: string; method: string; limit: number; windowMs: number }>;
  onExceeded?: (req: IncomingMessage, res: ServerResponse) => void;
  resolveRoute?: (req: IncomingMessage) => string;
}

function defaultResolveRoute(req: IncomingMessage): string {
  return (req as any).route?.path ?? req.url ?? '/';
}

function defaultOnExceeded(_req: IncomingMessage, res: ServerResponse): void {
  res.writeHead(429, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'quota exceeded' }));
}

export interface QuotaMiddlewareHandle {
  middleware: (req: IncomingMessage, res: ServerResponse, next: () => void) => void;
  getTracker: () => RouteQuotaTracker;
  reset: () => void;
}

export function createRouteQuotaMiddleware(
  options: QuotaMiddlewareOptions
): QuotaMiddlewareHandle {
  const tracker = createRouteQuotaTracker();
  const resolveRoute = options.resolveRoute ?? defaultResolveRoute;
  const onExceeded = options.onExceeded ?? defaultOnExceeded;

  for (const cfg of options.routes) {
    tracker.configure(cfg.route, cfg.method, cfg.limit, cfg.windowMs);
  }

  function middleware(
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void
  ): void {
    const route = resolveRoute(req);
    const method = req.method ?? 'GET';
    tracker.record(route, method);
    if (tracker.isExceeded(route, method)) {
      onExceeded(req, res);
      return;
    }
    next();
  }

  function getTracker(): RouteQuotaTracker {
    return tracker;
  }

  function reset(): void {
    tracker.resetAll();
  }

  return { middleware, getTracker, reset };
}
