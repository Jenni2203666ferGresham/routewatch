import { IncomingMessage, ServerResponse } from "http";
import { createRouteAbTestTracker, RouteAbTestTracker } from "./routeAbTestTracker";

export interface AbTestMiddlewareOptions {
  resolveRoute?: (req: IncomingMessage) => string;
  resolveVariant?: (req: IncomingMessage) => string | undefined;
  tracker?: RouteAbTestTracker;
}

function defaultResolveRoute(req: IncomingMessage): string {
  return (req as any).route?.path ?? req.url ?? "unknown";
}

function defaultResolveVariant(req: IncomingMessage): string | undefined {
  return (req as any).headers?.["x-ab-variant"] as string | undefined;
}

export function createRouteAbTestMiddleware(options: AbTestMiddlewareOptions = {}) {
  const tracker = options.tracker ?? createRouteAbTestTracker();
  const resolveRoute = options.resolveRoute ?? defaultResolveRoute;
  const resolveVariant = options.resolveVariant ?? defaultResolveVariant;

  function middleware(
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void
  ): void {
    const start = Date.now();
    const route = resolveRoute(req);
    const method = req.method ?? "GET";
    const variant = resolveVariant(req);

    res.on("finish", () => {
      if (!variant) return;
      const latency = Date.now() - start;
      const isError = res.statusCode >= 400;
      tracker.record(route, method, variant, latency, isError);
    });

    next();
  }

  function getTracker(): RouteAbTestTracker {
    return tracker;
  }

  function reset(): void {
    tracker.reset();
  }

  return { middleware, getTracker, reset };
}
