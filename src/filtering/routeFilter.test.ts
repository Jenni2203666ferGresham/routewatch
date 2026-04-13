import { createRouteFilter, validateRouteFilterConfig } from './routeFilter';

describe('createRouteFilter', () => {
  it('allows all routes when no config provided', () => {
    const filter = createRouteFilter({});
    expect(filter('/api/users')).toBe(true);
    expect(filter('/health')).toBe(true);
  });

  it('excludes exact route match', () => {
    const filter = createRouteFilter({ exclude: ['/health'] });
    expect(filter('/health')).toBe(false);
    expect(filter('/api/users')).toBe(true);
  });

  it('excludes routes matching wildcard pattern', () => {
    const filter = createRouteFilter({ exclude: ['/internal/*'] });
    expect(filter('/internal/metrics')).toBe(false);
    expect(filter('/internal/debug')).toBe(false);
    expect(filter('/api/users')).toBe(true);
  });

  it('includes only routes matching include patterns', () => {
    const filter = createRouteFilter({ include: ['/api/*'] });
    expect(filter('/api/users')).toBe(true);
    expect(filter('/api/orders')).toBe(true);
    expect(filter('/health')).toBe(false);
  });

  it('exclude takes priority over include', () => {
    const filter = createRouteFilter({
      include: ['/api/*'],
      exclude: ['/api/internal'],
    });
    expect(filter('/api/users')).toBe(true);
    expect(filter('/api/internal')).toBe(false);
  });

  it('supports multiple patterns in include and exclude', () => {
    const filter = createRouteFilter({
      include: ['/api/*', '/v2/*'],
      exclude: ['/api/admin', '/v2/debug'],
    });
    expect(filter('/api/users')).toBe(true);
    expect(filter('/v2/orders')).toBe(true);
    expect(filter('/api/admin')).toBe(false);
    expect(filter('/v2/debug')).toBe(false);
    expect(filter('/health')).toBe(false);
  });
});

describe('validateRouteFilterConfig', () => {
  it('returns no errors for valid config', () => {
    expect(validateRouteFilterConfig({ include: ['/api/*'], exclude: ['/health'] })).toEqual([]);
  });

  it('returns no errors for empty config', () => {
    expect(validateRouteFilterConfig({})).toEqual([]);
  });

  it('returns error when include is not an array', () => {
    const errors = validateRouteFilterConfig({ include: '/api/*' as any });
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/include/);
  });

  it('returns error when exclude is not an array', () => {
    const errors = validateRouteFilterConfig({ exclude: '/health' as any });
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/exclude/);
  });
});
