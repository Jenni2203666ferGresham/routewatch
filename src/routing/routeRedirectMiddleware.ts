import { IncomingMessage, ServerResponse } from 'http';
import { createRouteRedirectTracker, RouteRedirectTracker } from './routeRedirectTracker';

export interface RouteRedirectMiddlewareOptions {
  resolveRoute?: (req: IncomingMessage) => string;
}

export interface RedirectMiddlewareHandle {
  middleware: (req: IncomingMessage, res: ServerResponse, next: () => void) => void;
  getTracker: () => RouteRedirectTracker;
  reset: () => void;
}

function defaultResolveRoute(req: IncomingMessage): string {
  return req.url ?? '/';
}

export function createRouteRedirectMiddleware(
  options: RouteRedirectMiddlewareOptions = {}
): RedirectMiddlewareHandle {
  const resolve = options.resolveRoute ?? defaultResolveRoute;
  const tracker = createRouteRedirectTracker();

  function middleware(
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void
  ): void {
    const fromRoute = resolve(req);

    const originalWriteHead = res.writeHead.bind(res);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (res as any).writeHead = function (statusCode: number, ...args: any[]) {
      if (statusCode >= 300 && statusCode < 400) {
        const location =
          res.getHeader('location') ?? (args[0] && typeof args[0] === 'object' ? args[0]['location'] : undefined);
        if (typeof location === 'string' && location) {
          tracker.record(req.method ?? 'GET', fromRoute, location, statusCode);
        }
      }
      return originalWriteHead(statusCode, ...args);
    };

    next();
  }

  function getTracker(): RouteRedirectTracker {
    return tracker;
  }

  function reset(): void {
    tracker.reset();
  }

  return { middleware, getTracker, reset };
}
