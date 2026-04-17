import type { Request, Response, NextFunction } from 'express';
import { createRouteWatcher, RouteWatcher } from './routeWatcher';

export type RouteWatcherMiddlewareOptions = {
  watcher?: RouteWatcher;
  onNew?: (method: string, path: string) => void;
};

export type RouteWatcherMiddleware = {
  middleware: (req: Request, res: Response, next: NextFunction) => void;
  getWatcher: () => RouteWatcher;
};

export function createRouteWatcherMiddleware(
  options: RouteWatcherMiddlewareOptions = {}
): RouteWatcherMiddleware {
  const watcher = options.watcher ?? createRouteWatcher();

  if (options.onNew) {
    watcher.onChange((event) => {
      if (event.type === 'registered') {
        options.onNew!(event.method, event.path);
      }
    });
  }

  function middleware(req: Request, res: Response, next: NextFunction) {
    const method = req.method?.toUpperCase() ?? 'GET';
    const path = (req as any).route?.path ?? req.path ?? req.url ?? '/';
    const active = watcher.getActive();
    const already = active.some((r) => r.method === method && r.path === path);
    if (!already) {
      watcher.watch(method, path);
    }
    next();
  }

  return {
    middleware,
    getWatcher: () => watcher,
  };
}
