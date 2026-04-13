import { RouteFilterConfig, validateRouteFilterConfig } from './routeFilter';

export interface FilterConfigInput {
  include?: string[];
  exclude?: string[];
}

/**
 * Builds a validated RouteFilterConfig from raw CLI or config input.
 */
export function buildFilterConfig(input: FilterConfigInput): RouteFilterConfig {
  const config: RouteFilterConfig = {};

  if (input.include && input.include.length > 0) {
    config.include = input.include;
  }

  if (input.exclude && input.exclude.length > 0) {
    config.exclude = input.exclude;
  }

  const errors = validateRouteFilterConfig(config);
  if (errors.length > 0) {
    throw new Error(`Invalid filter config: ${errors.join(', ')}`);
  }

  return config;
}

/**
 * Parses comma-separated pattern strings into arrays.
 */
export function parsePatternList(raw: string | undefined): string[] {
  if (!raw || raw.trim() === '') return [];
  return raw
    .split(',')
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}
