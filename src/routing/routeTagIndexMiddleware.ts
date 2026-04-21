import type { Request, Response, NextFunction } from 'express';
import { createRouteTagIndex, RouteTagIndex } from './routeTagIndex';

export interface TagIndexMiddlewareOptions {
  index?: RouteTagIndex;
  defaultTags?: string[];
  getRouteTags?: (req: Request) => string[];
}

export interface RouteTagIndexMiddleware {
  middleware: (req: Request, res: Response, next: NextFunction) => void;
  getIndex(): RouteTagIndex;
  reset(): void;
}

export function createRouteTagIndexMiddleware(
  options: TagIndexMiddlewareOptions = {}
): RouteTagIndexMiddleware {
  const index = options.index ?? createRouteTagIndex();
  const defaultTags = options.defaultTags ?? [];

  function middleware(req: Request, res: Response, next: NextFunction): void {
    const method = req.method ?? 'GET';
    const path = (req as any).route?.path ?? req.path ?? req.url ?? '/';

    const extraTags = options.getRouteTags ? options.getRouteTags(req) : [];
    const tags = [...defaultTags, ...extraTags];

    if (tags.length > 0) {
      index.addTags(method, path, tags);
    }

    next();
  }

  function getIndex(): RouteTagIndex {
    return index;
  }

  function reset(): void {
    index.clear();
  }

  return { middleware, getIndex, reset };
}
