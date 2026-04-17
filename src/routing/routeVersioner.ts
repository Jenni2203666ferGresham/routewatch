export interface VersionedRoute {
  route: string;
  version: string;
  canonical: string;
}

export interface RouteVersioner {
  register(route: string, version: string): void;
  resolve(route: string): VersionedRoute | undefined;
  getAll(): VersionedRoute[];
  strip(route: string): string;
  extractVersion(route: string): string | undefined;
}

const VERSION_PREFIX_RE = /^\/v(\d+)(\/.*)?$/;

export function extractVersionFromPath(route: string): string | undefined {
  const m = route.match(VERSION_PREFIX_RE);
  return m ? `v${m[1]}` : undefined;
}

export function stripVersion(route: string): string {
  const m = route.match(VERSION_PREFIX_RE);
  if (!m) return route;
  return m[2] || '/';
}

export function createRouteVersioner(): RouteVersioner {
  const store = new Map<string, VersionedRoute>();

  function makeKey(route: string, version: string): string {
    return `${version}:${route}`;
  }

  return {
    register(route: string, version: string): void {
      const canonical = stripVersion(route) === route ? route : stripVersion(route);
      store.set(makeKey(route, version), { route, version, canonical });
    },

    resolve(route: string): VersionedRoute | undefined {
      const version = extractVersionFromPath(route);
      if (!version) return undefined;
      return store.get(makeKey(route, version));
    },

    getAll(): VersionedRoute[] {
      return Array.from(store.values());
    },

    strip(route: string): string {
      return stripVersion(route);
    },

    extractVersion(route: string): string | undefined {
      return extractVersionFromPath(route);
    },
  };
}
