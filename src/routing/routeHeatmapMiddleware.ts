import { Request, Response, NextFunction } from 'express';
import { RouteHeatmap, createRouteHeatmap } from './routeHeatmap';

export interface RouteHeatmapMiddleware {
  middleware(req: Request, res: Response, next: NextFunction): void;
  getHeatmap(): RouteHeatmap;
  reset(): void;
}

export function createRouteHeatmapMiddleware(
  heatmap: RouteHeatmap = createRouteHeatmap()
): RouteHeatmapMiddleware {
  function middleware(req: Request, res: Response, next: NextFunction): void {
    res.on('finish', () => {
      const route = (req as any).route?.path ?? req.path ?? req.url ?? '/';
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
