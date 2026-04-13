/**
 * Route filtering: include/exclude routes from metrics collection
 * based on glob-style patterns or exact matches.
 */

export interface RouteFilterConfig {
  include?: string[];
  exclude?: string[];
}

function matchesPattern(route: string, pattern: string): boolean {
  // Support simple wildcard '*' patterns
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  const regex = new RegExp(`^${escaped}$`);
  return regex.test(route);
}

function matchesAny(route: string, patterns: string[]): boolean {
  return patterns.some((p) => matchesPattern(route, p));
}

export function createRouteFilter(config: RouteFilterConfig) {
  const include = config.include ?? [];
  const exclude = config.exclude ?? [];

  return function shouldRecord(route: string): boolean {
    if (exclude.length > 0 && matchesAny(route, exclude)) {
      return false;
    }
    if (include.length > 0) {
      return matchesAny(route, include);
    }
    return true;
  };
}

export function validateRouteFilterConfig(config: RouteFilterConfig): string[] {
  const errors: string[] = [];
  if (config.include !== undefined && !Array.isArray(config.include)) {
    errors.push('"include" must be an array of strings');
  }
  if (config.exclude !== undefined && !Array.isArray(config.exclude)) {
    errors.push('"exclude" must be an array of strings');
  }
  return errors;
}
