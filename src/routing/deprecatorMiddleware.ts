import { IncomingMessage, ServerResponse } from 'http';
import { RouteDeprecator } from './routeDeprecator';

export interface DeprecatorMiddlewareOptions {
  warnHeader?: boolean;
  blockExpired?: boolean;
  onDeprecated?: (method: string, route: string) => void;
}

export function createDeprecatorMiddleware(
  deprecator: RouteDeprecator,
  options: DeprecatorMiddlewareOptions = {}
) {
  const { warnHeader = true, blockExpired = false, onDeprecated } = options;

  return function middleware(
    req: IncomingMessage & { path?: string },
    res: ServerResponse,
    next: () => void
  ): void {
    const method = req.method ?? 'GET';
    const route = (req as any).route?.path ?? req.path ?? req.url ?? '/';

    const entry = deprecator.getEntry(method, route);

    if (!entry) {
      return next();
    }

    if (onDeprecated) {
      onDeprecated(method, route);
    }

    const now = new Date();
    const isExpired = entry.sunsetAt !== undefined && entry.sunsetAt <= now;

    if (blockExpired && isExpired) {
      res.writeHead(410, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Gone', message: `Route ${method} ${route} has been removed.` }));
      return;
    }

    if (warnHeader) {
      res.setHeader('Deprecation', entry.deprecatedAt.toUTCString());
      if (entry.sunsetAt) {
        res.setHeader('Sunset', entry.sunsetAt.toUTCString());
      }
      if (entry.replacement) {
        res.setHeader('Link', `<${entry.replacement}>; rel="successor-version"`);
      }
    }

    next();
  };
}
