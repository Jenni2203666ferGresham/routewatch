import { createRouteAuthTracker, RouteAuthTracker } from './routeAuthTracker';

type Request = Record<string, any>;
type Response = Record<string, any>;
type NextFn = () => void;

export interface RouteAuthMiddlewareOptions {
  resolveRoute?: (req: Request) => { method: string; route: string };
  resolveAuth?: (req: Request) => { authenticated: boolean; userId?: string };
}

function defaultResolveRoute(req: Request): { method: string; route: string } {
  return {
    method: req.method ?? 'GET',
    route: req.route?.path ?? req.path ?? req.url ?? '/',
  };
}

function defaultResolveAuth(req: Request): { authenticated: boolean; userId?: string } {
  const user = req.user ?? req.auth;
  return {
    authenticated: !!user,
    userId: user?.id ?? user?.sub ?? user?.userId,
  };
}

export interface RouteAuthMiddlewareHandle {
  middleware: (req: Request, res: Response, next: NextFn) => void;
  getTracker: () => RouteAuthTracker;
  reset: () => void;
}

export function createRouteAuthMiddleware(
  options: RouteAuthMiddlewareOptions = {}
): RouteAuthMiddlewareHandle {
  const tracker = createRouteAuthTracker();
  const resolveRoute = options.resolveRoute ?? defaultResolveRoute;
  const resolveAuth = options.resolveAuth ?? defaultResolveAuth;

  function middleware(req: Request, _res: Response, next: NextFn): void {
    const { method, route } = resolveRoute(req);
    const { authenticated, userId } = resolveAuth(req);
    tracker.record({
      method,
      route,
      authenticated,
      userId,
      timestamp: Date.now(),
    });
    next();
  }

  function getTracker(): RouteAuthTracker {
    return tracker;
  }

  function reset(): void {
    tracker.reset();
  }

  return { middleware, getTracker, reset };
}
