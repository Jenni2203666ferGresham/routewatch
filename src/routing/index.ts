export { createRouteRegistry } from './routeRegistry';
export { normalizeRoute, extractParams, createRouteNormalizer } from './routeNormalizer';
export { createRouteMatcher } from './routeMatcher';
export { groupRoutes, extractPrefix, createRouteGrouper } from './routeGrouper';
export { createRouteAliasMap } from './routeAliasMap';
export { scoreRoute, createRouteScorer } from './routeScorer';
export { createRouteWatcher } from './routeWatcher';
export { createRouteWatcherMiddleware } from './routeWatcherMiddleware';
export { createRouteVersioner, extractVersionFromPath, stripVersion } from './routeVersioner';
