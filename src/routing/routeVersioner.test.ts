import {
  createRouteVersioner,
  extractVersionFromPath,
  stripVersion,
} from './routeVersioner';

describe('extractVersionFromPath', () => {
  it('extracts version from /v1/users', () => {
    expect(extractVersionFromPath('/v1/users')).toBe('v1');
  });

  it('extracts version from /v2/orders/123', () => {
    expect(extractVersionFromPath('/v2/orders/123')).toBe('v2');
  });

  it('returns undefined for unversioned route', () => {
    expect(extractVersionFromPath('/users')).toBeUndefined();
  });

  it('returns undefined for empty string', () => {
    expect(extractVersionFromPath('')).toBeUndefined();
  });
});

describe('stripVersion', () => {
  it('strips /v1 prefix', () => {
    expect(stripVersion('/v1/users')).toBe('/users');
  });

  it('returns / when only version prefix', () => {
    expect(stripVersion('/v1')).toBe('/');
  });

  it('returns original if no version', () => {
    expect(stripVersion('/users')).toBe('/users');
  });
});

describe('createRouteVersioner', () => {
  it('registers and resolves a versioned route', () => {
    const v = createRouteVersioner();
    v.register('/v1/users', 'v1');
    const result = v.resolve('/v1/users');
    expect(result).toBeDefined();
    expect(result?.version).toBe('v1');
    expect(result?.canonical).toBe('/users');
  });

  it('returns undefined for unregistered route', () => {
    const v = createRouteVersioner();
    expect(v.resolve('/v2/unknown')).toBeUndefined();
  });

  it('returns undefined when no version in route', () => {
    const v = createRouteVersioner();
    expect(v.resolve('/users')).toBeUndefined();
  });

  it('getAll returns all registered routes', () => {
    const v = createRouteVersioner();
    v.register('/v1/users', 'v1');
    v.register('/v2/users', 'v2');
    expect(v.getAll()).toHaveLength(2);
  });

  it('extractVersion delegates correctly', () => {
    const v = createRouteVersioner();
    expect(v.extractVersion('/v3/items')).toBe('v3');
    expect(v.extractVersion('/items')).toBeUndefined();
  });

  it('strip delegates correctly', () => {
    const v = createRouteVersioner();
    expect(v.strip('/v1/orders')).toBe('/orders');
  });
});
