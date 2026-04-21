import { Request, Response, NextFunction } from 'express';
import { createRouteErrorLog, RouteErrorLog } from './routeErrorLog';

export interface RouteErrorLogMiddlewareOptions {
  maxEntries?: number;
  includeClientErrors?: boolean;
  traceIdHeader?: string;
}

export interface RouteErrorLogMiddleware {
  middleware: (req: Request, res: Response, next: NextFunction) => void;
  getLog(): RouteErrorLog;
  reset(): void;
}

export function createRouteErrorLogMiddleware(
  options: RouteErrorLogMiddlewareOptions = {}
): RouteErrorLogMiddleware {
  const {
    maxEntries = 1000,
    includeClientErrors = true,
    traceIdHeader = 'x-trace-id',
  } = options;

  const log = createRouteErrorLog(maxEntries);

  function middleware(req: Request, res: Response, next: NextFunction): void {
    res.on('finish', () => {
      const code = res.statusCode;
      const isError = includeClientErrors ? code >= 400 : code >= 500;
      if (!isError) return;

      const route: string =
        (req as any).route?.path ?? req.path ?? req.url ?? 'unknown';
      const method = req.method ?? 'UNKNOWN';
      const traceId =
        (req.headers[traceIdHeader] as string | undefined) ?? undefined;

      log.record({
        route,
        method,
        statusCode: code,
        message: res.statusMessage ?? '',
        timestamp: Date.now(),
        traceId,
      });
    });

    next();
  }

  function getLog(): RouteErrorLog {
    return log;
  }

  function reset(): void {
    log.clear();
  }

  return { middleware, getLog, reset };
}
