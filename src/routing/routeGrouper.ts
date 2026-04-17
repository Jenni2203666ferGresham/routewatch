export interface RouteGroup {
  prefix: string;
  routes: string[];
  count: number;
}

export interface RouteGrouperOptions {
  depth?: number; // how many path segments to group by
}

export function groupRoutes(
  routes: string[],
  options: RouteGrouperOptions = {}
): RouteGroup[] {
  const depth = options.depth ?? 1;
  const groupMap = new Map<string, string[]>();

  for (const route of routes) {
    const prefix = extractPrefix(route, depth);
    if (!groupMap.has(prefix)) {
      groupMap.set(prefix, []);
    }
    groupMap.get(prefix)!.push(route);
  }

  const groups: RouteGroup[] = [];
  for (const [prefix, members] of groupMap.entries()) {
    groups.push({ prefix, routes: members, count: members.length });
  }

  return groups.sort((a, b) => b.count - a.count);
}

export function extractPrefix(route: string, depth: number): string {
  const segments = route.split('/').filter(Boolean);
  const taken = segments.slice(0, depth);
  return '/' + taken.join('/');
}

export function createRouteGrouper(options: RouteGrouperOptions = {}) {
  return {
    group(routes: string[]): RouteGroup[] {
      return groupRoutes(routes, options);
    },
    topGroups(routes: string[], n: number): RouteGroup[] {
      return groupRoutes(routes, options).slice(0, n);
    },
  };
}
