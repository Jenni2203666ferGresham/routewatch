import { Request, Response, NextFunction } from 'express';
import {
  createRouteRequestCounter,
  RouteRequestCounter,
} from './routeRequestCounter';

export interface RouteRequestCounterMiddleware {
  middleware: (req: Request, res: Response, next: NextFunction) => void;
  getCounter(): RouteRequestCounter;
  reset(): void;
}

function resolveRoute(req: Request): string {
  return (req.route?.path as string) ?? req.path ?? 'unknown';
}

export function createRouteRequestCounterMiddleware(
  counter?: RouteRequestCounter
): RouteRequestCounterMiddleware {
  const internal = counter ?? createRouteRequestCounter();

  function middleware(req: Request, _res: Response, next: NextFunction): void {
    const route = resolveRoute(req);
    const method = req.method ?? 'GET';
    internal.record(method, route);
    next();
  }

  function getCounter(): RouteRequestCounter {
    return internal;
  }

  function reset(): void {
    internal.reset();
  }

  return { middleware, getCounter, reset };
}
