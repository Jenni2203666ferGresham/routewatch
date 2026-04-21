import { createRouteOwnershipMap } from './routeOwnershipMap';

describe('createRouteOwnershipMap', () => {
  it('assigns and retrieves ownership', () => {
    const map = createRouteOwnershipMap();
    map.assign('GET', '/users', 'alice', { team: 'platform' });
    const entry = map.getOwner('GET', '/users');
    expect(entry).toBeDefined();
    expect(entry!.owner).toBe('alice');
    expect(entry!.team).toBe('platform');
    expect(entry!.method).toBe('GET');
    expect(entry!.path).toBe('/users');
  });

  it('is case-insensitive on method', () => {
    const map = createRouteOwnershipMap();
    map.assign('get', '/items', 'bob');
    expect(map.getOwner('GET', '/items')).toBeDefined();
  });

  it('returns undefined for unknown route', () => {
    const map = createRouteOwnershipMap();
    expect(map.getOwner('POST', '/unknown')).toBeUndefined();
  });

  it('unassigns a route', () => {
    const map = createRouteOwnershipMap();
    map.assign('DELETE', '/records', 'carol');
    expect(map.unassign('DELETE', '/records')).toBe(true);
    expect(map.getOwner('DELETE', '/records')).toBeUndefined();
  });

  it('returns false when unassigning unknown route', () => {
    const map = createRouteOwnershipMap();
    expect(map.unassign('GET', '/nope')).toBe(false);
  });

  it('getByOwner returns all routes for an owner', () => {
    const map = createRouteOwnershipMap();
    map.assign('GET', '/a', 'alice');
    map.assign('POST', '/b', 'alice');
    map.assign('GET', '/c', 'bob');
    const aliceRoutes = map.getByOwner('alice');
    expect(aliceRoutes).toHaveLength(2);
    expect(aliceRoutes.every((r) => r.owner === 'alice')).toBe(true);
  });

  it('getByTeam returns all routes for a team', () => {
    const map = createRouteOwnershipMap();
    map.assign('GET', '/x', 'alice', { team: 'infra' });
    map.assign('GET', '/y', 'bob', { team: 'infra' });
    map.assign('GET', '/z', 'carol', { team: 'product' });
    expect(map.getByTeam('infra')).toHaveLength(2);
    expect(map.getByTeam('product')).toHaveLength(1);
  });

  it('getAll returns all entries', () => {
    const map = createRouteOwnershipMap();
    map.assign('GET', '/p', 'alice');
    map.assign('POST', '/q', 'bob');
    expect(map.getAll()).toHaveLength(2);
  });

  it('clear removes all entries', () => {
    const map = createRouteOwnershipMap();
    map.assign('GET', '/r', 'alice');
    map.clear();
    expect(map.getAll()).toHaveLength(0);
  });

  it('records addedAt timestamp', () => {
    const before = Date.now();
    const map = createRouteOwnershipMap();
    map.assign('GET', '/ts', 'alice');
    const entry = map.getOwner('GET', '/ts');
    expect(entry!.addedAt).toBeGreaterThanOrEqual(before);
  });
});
