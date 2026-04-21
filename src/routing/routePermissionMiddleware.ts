import { IncomingMessage, ServerResponse } from 'http';
import { createRoutePermissionMap, RoutePermissionMap, Permission } from './routePermissionMap';

export interface PermissionMiddlewareOptions {
  map?: RoutePermissionMap;
  getUserPermissions: (req: IncomingMessage) => Permission[];
  onDenied?: (req: IncomingMessage, res: ServerResponse) => void;
}

function defaultOnDenied(_req: IncomingMessage, res: ServerResponse): void {
  res.writeHead(403, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Forbidden', message: 'Insufficient permissions' }));
}

export function createRoutePermissionMiddleware(options: PermissionMiddlewareOptions) {
  const map = options.map ?? createRoutePermissionMap();
  const onDenied = options.onDenied ?? defaultOnDenied;

  function middleware(
    req: IncomingMessage & { routePath?: string },
    res: ServerResponse,
    next: () => void
  ): void {
    const method = req.method ?? 'GET';
    const path = req.routePath ?? req.url ?? '/';
    const userPermissions = options.getUserPermissions(req);
    const allowed = map.check(method, path, userPermissions);
    if (!allowed) {
      onDenied(req, res);
      return;
    }
    next();
  }

  function getMap(): RoutePermissionMap {
    return map;
  }

  return { middleware, getMap };
}
