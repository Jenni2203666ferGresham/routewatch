export interface DeprecationEntry {
  route: string;
  method: string;
  deprecatedAt: Date;
  sunsetAt?: Date;
  replacement?: string;
  message?: string;
}

export interface RouteDeprecator {
  deprecate(method: string, route: string, options?: Partial<Omit<DeprecationEntry, 'route' | 'method' | 'deprecatedAt'>>): void;
  undeprecate(method: string, route: string): void;
  isDeprecated(method: string, route: string): boolean;
  getEntry(method: string, route: string): DeprecationEntry | undefined;
  getAll(): DeprecationEntry[];
  getExpired(asOf?: Date): DeprecationEntry[];
  getSunsetingSoon(withinDays: number, asOf?: Date): DeprecationEntry[];
}

function makeKey(method: string, route: string): string {
  return `${method.toUpperCase()}:${route}`;
}

export function createRouteDeprecator(): RouteDeprecator {
  const entries = new Map<string, DeprecationEntry>();

  function deprecate(method: string, route: string, options: Partial<Omit<DeprecationEntry, 'route' | 'method' | 'deprecatedAt'>> = {}): void {
    const key = makeKey(method, route);
    entries.set(key, {
      route,
      method: method.toUpperCase(),
      deprecatedAt: new Date(),
      ...options,
    });
  }

  function undeprecate(method: string, route: string): void {
    entries.delete(makeKey(method, route));
  }

  function isDeprecated(method: string, route: string): boolean {
    return entries.has(makeKey(method, route));
  }

  function getEntry(method: string, route: string): DeprecationEntry | undefined {
    return entries.get(makeKey(method, route));
  }

  function getAll(): DeprecationEntry[] {
    return Array.from(entries.values());
  }

  function getExpired(asOf: Date = new Date()): DeprecationEntry[] {
    return getAll().filter(e => e.sunsetAt !== undefined && e.sunsetAt <= asOf);
  }

  /**
   * Returns all deprecated routes whose sunset date falls within the next
   * `withinDays` days from `asOf`, excluding already-expired routes.
   */
  function getSunsetingSoon(withinDays: number, asOf: Date = new Date()): DeprecationEntry[] {
    const cutoff = new Date(asOf.getTime() + withinDays * 24 * 60 * 60 * 1000);
    return getAll().filter(
      e => e.sunsetAt !== undefined && e.sunsetAt > asOf && e.sunsetAt <= cutoff
    );
  }

  return { deprecate, undeprecate, isDeprecated, getEntry, getAll, getExpired, getSunsetingSoon };
}
