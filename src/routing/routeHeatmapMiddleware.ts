import { Request, Response, NextFunction } from 'express';
import { RouteHeatmap, createRouteHeatmap } from './routeHeatmap';

export interface RouteHeatmapMiddleware {
  middleware(req: Request, res: Response, next: NextFunction): void;
  getHeatmap(): RouteHeatmap;
  reset(): void;
}

/**
 * Normalizes a route path by stripping query strings and trailing slashes.
 * Falls back to '/' if no meaningful path can be determined.
 */
function resolveRoute(req: Request): string {
  const raw = (req as any).route?.path ?? req.path ?? req.url ?? '/';
  return raw.split('?')[0].replace(/\/$/, '') || '/';
}

export function createRouteHeatmapMiddleware(
  heatmap: RouteHeatmap = createRouteHeatmap()
): RouteHeatmapMiddleware {
  function middleware(req: Request, res: Response, next: NextFunction): void {
    res.on('finish', () => {
      const route = resolveRoute(req);
      const method = req.method ?? 'GET';
      heatmap.record(route, method);
    });
    next();
  }

  return {
    middleware,
    getHeatmap: () => heatmap,
    reset: () => heatmap.reset(),
  };
}
