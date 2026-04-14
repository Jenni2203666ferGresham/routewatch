export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  enabled: boolean;
  keyBy: 'ip' | 'route' | 'ip+route';
}

const DEFAULTS: RateLimitConfig = {
  windowMs: 60_000,
  maxRequests: 100,
  enabled: true,
  keyBy: 'ip+route',
};

export function buildRateLimitConfig(partial: Partial<RateLimitConfig> = {}): RateLimitConfig {
  return { ...DEFAULTS, ...partial };
}

export interface RateLimitConfigValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateRateLimitConfig(config: RateLimitConfig): RateLimitConfigValidationResult {
  const errors: string[] = [];

  if (config.windowMs <= 0) {
    errors.push('windowMs must be a positive number');
  }
  if (config.maxRequests <= 0) {
    errors.push('maxRequests must be a positive integer');
  }
  if (!['ip', 'route', 'ip+route'].includes(config.keyBy)) {
    errors.push(`keyBy must be one of: ip, route, ip+route`);
  }

  return { valid: errors.length === 0, errors };
}
