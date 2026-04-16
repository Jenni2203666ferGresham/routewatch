import { normalizeRoute, extractParams, createRouteNormalizer } from './routeNormalizer';

describe('normalizeRoute', () => {
  it('lowercases by default', () => {
    expect(normalizeRoute('/Users/Profile')).toBe('/users/:param');
  });

  it('strips trailing slash', () => {
    expect(normalizeRoute('/api/users/')).toBe('/api/users');
  });

  it('collapses double slashes', () => {
    expect(normalizeRoute('/api//users')).toBe('/api/users');
  });

  it('replaces :param segments', () => {
    expect(normalizeRoute('/api/users/:id')).toBe('/api/users/:param');
  });

  it('replaces multiple params', () => {
    expect(normalizeRoute('/api/:version/users/:id')).toBe('/api/:param/users/:param');
  });

  it('preserves root slash', () => {
    expect(normalizeRoute('/')).toBe('/');
  });

  it('respects lowercase=false', () => {
    expect(normalizeRoute('/API/Users', { lowercase: false })).toBe('/API/Users');
  });

  it('respects stripTrailingSlash=false', () => {
    expect(normalizeRoute('/api/users/', { stripTrailingSlash: false })).toBe('/api/users/');
  });

  it('uses custom paramReplacement', () => {
    expect(normalizeRoute('/users/:id', { paramReplacement: '/{id}' })).toBe('/users/{id}');
  });
});

describe('extractParams', () => {
  it('returns empty array for no params', () => {
    expect(extractParams('/api/users')).toEqual([]);
  });

  it('extracts single param', () => {
    expect(extractParams('/api/users/:id')).toEqual(['id']);
  });

  it('extracts multiple params', () => {
    expect(extractParams('/api/:version/users/:id')).toEqual(['version', 'id']);
  });
});

describe('createRouteNormalizer', () => {
  it('creates normalizer with preset options', () => {
    const n = createRouteNormalizer({ lowercase: false });
    expect(n.normalize('/API/Users/:id')).toBe('/API/Users/:param');
  });

  it('exposes extractParams', () => {
    const n = createRouteNormalizer();
    expect(n.extractParams('/a/:b/:c')).toEqual(['b', 'c']);
  });
});
