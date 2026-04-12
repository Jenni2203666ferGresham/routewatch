import { Request, Response, NextFunction } from 'express';
import { RouteMetrics } from '../metrics/RouteMetrics';

export interface MiddlewareOptions {
  ignoreRoutes?: string[];
  trackQueryParams?: boolean;
}

/**
 * Creates an Express middleware that records route latency and usage
 * into the provided RouteMetrics instance.
 */
export function createExpressMiddleware(
  metrics: RouteMetrics,
  options: MiddlewareOptions = {}
) {
  const { ignoreRoutes = [], trackQueryParams = false } = options;

  return function routeWatchMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    const startTime = process.hrtime.bigint();

    res.on('finish', () => {
      const route = req.route?.path ?? req.path;
      const method = req.method.toUpperCase();
      const key = trackQueryParams
        ? `${method} ${route}?${new URLSearchParams(req.query as Record<string, string>).toString()}`
        : `${method} ${route}`;

      if (ignoreRoutes.includes(route)) {
        return;
      }

      const durationMs =
        Number(process.hrtime.bigint() - startTime) / 1_000_000;

      metrics.record(method, route, res.statusCode, durationMs);
    });

    next();
  };
}
