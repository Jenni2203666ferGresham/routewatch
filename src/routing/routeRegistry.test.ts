import { createRouteRegistry } from './routeRegistry';

describe('createRouteRegistry', () => {
  it('registers a route', () => {
    const registry = createRouteRegistry();
    registry.register('GET', '/users');
    expect(registry.has('GET', '/users')).toBe(true);
    expect(registry.size()).toBe(1);
  });

  it('normalises method to uppercase', () => {
    const registry = createRouteRegistry();
    registry.register('get', '/ping');
    expect(registry.has('GET', '/ping')).toBe(true);
  });

  it('does not duplicate registrations', () => {
    const registry = createRouteRegistry();
    registry.register('POST', '/items');
    registry.register('POST', '/items');
    expect(registry.size()).toBe(1);
  });

  it('unregisters a route', () => {
    const registry = createRouteRegistry();
    registry.register('DELETE', '/items/:id');
    registry.unregister('DELETE', '/items/:id');
    expect(registry.has('DELETE', '/items/:id')).toBe(false);
    expect(registry.size()).toBe(0);
  });

  it('returns all routes', () => {
    const registry = createRouteRegistry();
    registry.register('GET', '/a');
    registry.register('POST', '/b');
    const all = registry.getAll();
    expect(all).toHaveLength(2);
    expect(all.map(r => r.path)).toContain('/a');
  });

  it('filters routes by tag', () => {
    const registry = createRouteRegistry();
    registry.register('GET', '/public', ['public']);
    registry.register('GET', '/admin', ['admin']);
    registry.register('POST', '/admin/users', ['admin']);
    const adminRoutes = registry.getByTag('admin');
    expect(adminRoutes).toHaveLength(2);
    expect(adminRoutes.every(r => r.tags?.includes('admin'))).toBe(true);
  });

  it('clears all routes', () => {
    const registry = createRouteRegistry();
    registry.register('GET', '/x');
    registry.clear();
    expect(registry.size()).toBe(0);
  });

  it('stores addedAt timestamp', () => {
    const before = Date.now();
    const registry = createRouteRegistry();
    registry.register('GET', '/ts');
    const [route] = registry.getAll();
    expect(route.addedAt).toBeGreaterThanOrEqual(before);
  });
});
