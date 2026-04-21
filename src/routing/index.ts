export { createRouteRegistry } from './routeRegistry';
export type { RouteRegistry } from './routeRegistry';

export { normalizeRoute, extractParams, createRouteNormalizer } from './routeNormalizer';

export { createRouteMatcher } from './routeMatcher';

export { groupRoutes, extractPrefix, createRouteGrouper } from './routeGrouper';

export { createRouteAliasMap } from './routeAliasMap';

export { scoreRoute, createRouteScorer } from './routeScorer';

export { createRouteWatcher } from './routeWatcher';

export { createRouteWatcherMiddleware } from './routeWatcherMiddleware';

export { extractVersionFromPath, stripVersion, createRouteVersioner } from './routeVersioner';

export { createRouteDeprecator } from './routeDeprecator';
export { createDeprecatorMiddleware } from './deprecatorMiddleware';

export { createRoutePriorityQueue } from './routePriorityQueue';
export { createRoutePriorityMiddleware } from './routePriorityMiddleware';

export { createRouteChangeLog } from './routeChangeLog';

export { createRouteLifecycle } from './routeLifecycle';

export { createRouteDependencyGraph } from './routeDependencyGraph';

export { createRouteMetadataStore } from './routeMetadataStore';
export { createRouteMetadataMiddleware } from './routeMetadataMiddleware';

export { createRouteAccessLog } from './routeAccessLog';

export { createRouteTagIndex } from './routeTagIndex';
export type { RouteTagIndex, TagIndexEntry } from './routeTagIndex';

export { createRouteTagIndexMiddleware } from './routeTagIndexMiddleware';
export type { RouteTagIndexMiddleware, TagIndexMiddlewareOptions } from './routeTagIndexMiddleware';
