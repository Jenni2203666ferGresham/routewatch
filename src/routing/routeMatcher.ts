import { createRouteNormalizer } from './routeNormalizer';

export interface MatchResult {
  matched: boolean;
  pattern: string | null;
  params: Record<string, string>;
}

export interface RouteMatcher {
  addPattern: (pattern: string) => void;
  removePattern: (pattern: string) => void;
  match: (method: string, path: string) => MatchResult;
  listPatterns: () => string[];
}

export function createRouteMatcher(): RouteMatcher {
  const patterns: Set<string> = new Set();
  const normalizer = createRouteNormalizer();

  function addPattern(pattern: string): void {
    patterns.add(pattern);
  }

  function removePattern(pattern: string): void {
    patterns.delete(pattern);
  }

  function match(method: string, path: string): MatchResult {
    const normalized = normalizer.normalize(path);

    for (const pattern of patterns) {
      const [patternMethod, patternPath] = pattern.includes(' ')
        ? pattern.split(' ', 2)
        : ['*', pattern];

      if (patternMethod !== '*' && patternMethod.toUpperCase() !== method.toUpperCase()) {
        continue;
      }

      const params = matchPath(patternPath, normalized);
      if (params !== null) {
        return { matched: true, pattern, params };
      }
    }

    return { matched: false, pattern: null, params: {} };
  }

  function matchPath(pattern: string, path: string): Record<string, string> | null {
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');

    if (patternParts.length !== pathParts.length) return null;

    const params: Record<string, string> = {};

    for (let i = 0; i < patternParts.length; i++) {
      const pp = patternParts[i];
      const sp = pathParts[i];

      if (pp === '*') continue;
      if (pp.startsWith(':')) {
        params[pp.slice(1)] = sp;
      } else if (pp !== sp) {
        return null;
      }
    }

    return params;
  }

  function listPatterns(): string[] {
    return Array.from(patterns);
  }

  return { addPattern, removePattern, match, listPatterns };
}
