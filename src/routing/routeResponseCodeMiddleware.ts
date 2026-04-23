import type { Request, Response, NextFunction } from 'express';
import {
  createRouteResponseCodeTracker,
  RouteResponseCodeTracker,
} from './routeResponseCodeTracker';

export interface RouteResponseCodeMiddleware {
  middleware: (req: Request, res: Response, next: NextFunction) => void;
  getTracker: () => RouteResponseCodeTracker;
  reset: () => void;
}

function resolveRoute(req: Request): string {
  return (req as any).route?.path ?? req.path ?? 'unknown';
}

export function createRouteResponseCodeMiddleware(
  tracker?: RouteResponseCodeTracker
): RouteResponseCodeMiddleware {
  const _tracker = tracker ?? createRouteResponseCodeTracker();

  function middleware(req: Request, res: Response, next: NextFunction): void {
    res.on('finish', () => {
      const route = resolveRoute(req);
      const method = req.method ?? 'GET';
      _tracker.record(method, route, res.statusCode);
    });
    next();
  }

  function getTracker(): RouteResponseCodeTracker {
    return _tracker;
  }

  function reset(): void {
    _tracker.reset();
  }

  return { middleware, getTracker, reset };
}
