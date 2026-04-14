import { buildRateLimitConfig, validateRateLimitConfig } from './rateLimitConfig';

describe('buildRateLimitConfig', () => {
  it('returns defaults when called with no arguments', () => {
    const config = buildRateLimitConfig();
    expect(config.windowMs).toBe(60_000);
    expect(config.maxRequests).toBe(100);
    expect(config.enabled).toBe(true);
    expect(config.keyBy).toBe('ip+route');
  });

  it('merges partial overrides with defaults', () => {
    const config = buildRateLimitConfig({ maxRequests: 50, enabled: false });
    expect(config.maxRequests).toBe(50);
    expect(config.enabled).toBe(false);
    expect(config.windowMs).toBe(60_000);
  });
});

describe('validateRateLimitConfig', () => {
  it('returns valid for a correct config', () => {
    const config = buildRateLimitConfig();
    const result = validateRateLimitConfig(config);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns error for non-positive windowMs', () => {
    const config = buildRateLimitConfig({ windowMs: 0 });
    const result = validateRateLimitConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('windowMs must be a positive number');
  });

  it('returns error for non-positive maxRequests', () => {
    const config = buildRateLimitConfig({ maxRequests: -1 });
    const result = validateRateLimitConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('maxRequests must be a positive integer');
  });

  it('returns error for invalid keyBy value', () => {
    const config = buildRateLimitConfig({ keyBy: 'invalid' as any });
    const result = validateRateLimitConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/keyBy must be one of/);
  });

  it('accumulates multiple errors', () => {
    const config = buildRateLimitConfig({ windowMs: -1, maxRequests: 0 });
    const result = validateRateLimitConfig(config);
    expect(result.errors).toHaveLength(2);
  });
});
