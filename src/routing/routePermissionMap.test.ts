import { createRoutePermissionMap } from './routePermissionMap';

describe('createRoutePermissionMap', () => {
  it('returns true when no permissions are assigned', () => {
    const m = createRoutePermissionMap();
    expect(m.check('GET', '/users', [])).toBe(true);
  });

  it('assigns and retrieves permissions', () => {
    const m = createRoutePermissionMap();
    m.assign('GET', '/admin', ['admin:read']);
    const entry = m.getPermissions('GET', '/admin');
    expect(entry).toBeDefined();
    expect(entry!.permissions).toContain('admin:read');
    expect(entry!.requireAll).toBe(true);
  });

  it('checks requireAll=true correctly', () => {
    const m = createRoutePermissionMap();
    m.assign('POST', '/admin', ['admin:read', 'admin:write'], true);
    expect(m.check('POST', '/admin', ['admin:read'])).toBe(false);
    expect(m.check('POST', '/admin', ['admin:read', 'admin:write'])).toBe(true);
  });

  it('checks requireAll=false correctly', () => {
    const m = createRoutePermissionMap();
    m.assign('DELETE', '/resource', ['admin', 'owner'], false);
    expect(m.check('DELETE', '/resource', ['owner'])).toBe(true);
    expect(m.check('DELETE', '/resource', [])).toBe(false);
  });

  it('hasPermission returns true if permission exists in entry', () => {
    const m = createRoutePermissionMap();
    m.assign('GET', '/items', ['items:read']);
    expect(m.hasPermission('GET', '/items', 'items:read')).toBe(true);
    expect(m.hasPermission('GET', '/items', 'items:write')).toBe(false);
  });

  it('hasPermission returns true for unregistered routes', () => {
    const m = createRoutePermissionMap();
    expect(m.hasPermission('GET', '/unknown', 'anything')).toBe(true);
  });

  it('unassigns a route', () => {
    const m = createRoutePermissionMap();
    m.assign('GET', '/secure', ['secure:read']);
    m.unassign('GET', '/secure');
    expect(m.getPermissions('GET', '/secure')).toBeUndefined();
    expect(m.check('GET', '/secure', [])).toBe(true);
  });

  it('getAll returns all entries', () => {
    const m = createRoutePermissionMap();
    m.assign('GET', '/a', ['perm:a']);
    m.assign('POST', '/b', ['perm:b']);
    const all = m.getAll();
    expect(all).toHaveLength(2);
  });

  it('clear removes all entries', () => {
    const m = createRoutePermissionMap();
    m.assign('GET', '/x', ['x:read']);
    m.clear();
    expect(m.getAll()).toHaveLength(0);
  });

  it('is case-insensitive for method', () => {
    const m = createRoutePermissionMap();
    m.assign('get', '/lower', ['lower:read']);
    expect(m.check('GET', '/lower', ['lower:read'])).toBe(true);
    expect(m.getPermissions('GET', '/lower')).toBeDefined();
  });
});
