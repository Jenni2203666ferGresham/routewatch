import { Request, Response, NextFunction } from 'express';
import {
  createRoutePayloadTracker,
  RoutePayloadTracker,
} from './routePayloadTracker';

export interface RoutePayloadMiddlewareOptions {
  getRoute?: (req: Request) => string;
  getMethod?: (req: Request) => string;
}

const defaultGetRoute = (req: Request): string =>
  (req as any).route?.path ?? req.path ?? 'unknown';

const defaultGetMethod = (req: Request): string =>
  req.method?.toUpperCase() ?? 'GET';

export function createRoutePayloadMiddleware(options: RoutePayloadMiddlewareOptions = {}) {
  const tracker: RoutePayloadTracker = createRoutePayloadTracker();
  const getRoute = options.getRoute ?? defaultGetRoute;
  const getMethod = options.getMethod ?? defaultGetMethod;

  function middleware(req: Request, res: Response, next: NextFunction): void {
    const route = getRoute(req);
    const method = getMethod(req);
    const requestSize = parseInt(req.headers['content-length'] ?? '0', 10) || 0;

    const originalEnd = res.end.bind(res);
    (res as any).end = function (chunk?: any, ...args: any[]) {
      const responseSize =
        chunk instanceof Buffer
          ? chunk.byteLength
          : typeof chunk === 'string'
          ? Buffer.byteLength(chunk)
          : 0;
      tracker.record(route, method, requestSize, responseSize);
      return originalEnd(chunk, ...args);
    };

    next();
  }

  function getTracker(): RoutePayloadTracker {
    return tracker;
  }

  function reset(): void {
    tracker.reset();
  }

  return { middleware, getTracker, reset };
}
