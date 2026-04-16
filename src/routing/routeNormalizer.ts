/**
 * Normalizes raw route paths for consistent matching and storage.
 */

export interface NormalizeOptions {
  lowercase?: boolean;
  stripTrailingSlash?: boolean;
  collapseSlashes?: boolean;
  paramPattern?: RegExp;
  paramReplacement?: string;
}

const DEFAULT_PARAM_PATTERN = /\/[^/]*:[^/]+/g;
const SEGMENT_PARAM = /:([^/]+)/g;

export function normalizeRoute(route: string, opts: NormalizeOptions = {}): string {
  const {
    lowercase = true,
    stripTrailingSlash = true,
    collapseSlashes = true,
    paramReplacement = '/:param',
  } = opts;

  let r = route;

  if (collapseSlashes) {
    r = r.replace(/\/+/g, '/');
  }

  if (stripTrailingSlash && r.length > 1 && r.endsWith('/')) {
    r = r.slice(0, -1);
  }

  if (lowercase) {
    r = r.toLowerCase();
  }

  // Replace express-style :param segments
  r = r.replace(SEGMENT_PARAM, paramReplacement);

  return r;
}

export function extractParams(route: string): string[] {
  const matches: string[] = [];
  let m: RegExpExecArray | null;
  const re = /:([^/]+)/g;
  while ((m = re.exec(route)) !== null) {
    matches.push(m[1]);
  }
  return matches;
}

export function createRouteNormalizer(opts: NormalizeOptions = {}) {
  return {
    normalize: (route: string) => normalizeRoute(route, opts),
    extractParams,
  };
}
