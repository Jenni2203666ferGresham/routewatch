import { IncomingMessage, ServerResponse } from 'http';
import { RouteOwnershipMap } from './routeOwnershipMap';

export interface OwnershipMiddlewareOptions {
  /** Header name to inject the owner into the response. Default: 'x-route-owner' */
  ownerHeader?: string;
  /** Header name to inject the team. Default: 'x-route-team' */
  teamHeader?: string;
  /** If true, skip injection when no ownership entry is found. Default: true */
  skipIfUnknown?: boolean;
}

export function createRouteOwnershipMiddleware(
  ownershipMap: RouteOwnershipMap,
  options: OwnershipMiddlewareOptions = {}
) {
  const ownerHeader = options.ownerHeader ?? 'x-route-owner';
  const teamHeader = options.teamHeader ?? 'x-route-team';
  const skipIfUnknown = options.skipIfUnknown ?? true;

  return function middleware(
    req: IncomingMessage & { method?: string; path?: string; url?: string },
    res: ServerResponse,
    next: () => void
  ): void {
    const method = req.method ?? 'GET';
    const path = (req as any).path ?? req.url ?? '/';

    const ownership = ownershipMap.getOwner(method, path);

    if (!ownership && skipIfUnknown) {
      return next();
    }

    if (ownership) {
      res.setHeader(ownerHeader, ownership.owner);
      if (ownership.team) {
        res.setHeader(teamHeader, ownership.team);
      }
    }

    next();
  };
}
