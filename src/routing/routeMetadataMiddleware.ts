import { IncomingMessage, ServerResponse } from 'http';
import { RouteMetadataStore } from './routeMetadataStore';

export interface MetadataMiddlewareOptions {
  /** If true, attaches metadata to res.locals (Express-style) */
  attachToLocals?: boolean;
  /** Header name to emit the route tags in (comma-separated) */
  tagsHeader?: string;
  /** Header name to emit a deprecation warning */
  deprecationHeader?: string;
}

const DEFAULT_TAGS_HEADER = 'x-route-tags';
const DEFAULT_DEPRECATION_HEADER = 'x-route-deprecated';

export function createRouteMetadataMiddleware(
  metaStore: RouteMetadataStore,
  options: MetadataMiddlewareOptions = {}
) {
  const {
    attachToLocals = true,
    tagsHeader = DEFAULT_TAGS_HEADER,
    deprecationHeader = DEFAULT_DEPRECATION_HEADER,
  } = options;

  return function middleware(
    req: IncomingMessage & { method?: string; path?: string; url?: string },
    res: ServerResponse & { locals?: Record<string, unknown> },
    next: () => void
  ): void {
    const method = req.method ?? 'GET';
    const route = (req as { route?: { path?: string } }).route?.path ??
      req.path ??
      req.url ??
      '/';

    const meta = metaStore.get(route, method);

    if (meta) {
      if (meta.tags && meta.tags.length > 0) {
        res.setHeader(tagsHeader, meta.tags.join(','));
      }
      if (meta.deprecated) {
        res.setHeader(deprecationHeader, 'true');
      }
      if (attachToLocals && res.locals !== undefined) {
        res.locals['routeMeta'] = meta;
      }
    }

    next();
  };
}
