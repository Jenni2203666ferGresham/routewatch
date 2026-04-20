import { createRouteChangeLog, RouteChangeEvent } from './routeChangeLog';

function makeEvent(
  overrides: Partial<Omit<RouteChangeEvent, 'timestamp'>> = {}
): Omit<RouteChangeEvent, 'timestamp'> {
  return {
    action: 'registered',
    route: '/api/users',
    method: 'GET',
    ...overrides,
  };
}

describe('createRouteChangeLog', () => {
  it('records an event and retrieves it', () => {
    const log = createRouteChangeLog();
    log.record(makeEvent());
    expect(log.size()).toBe(1);
    const all = log.getAll();
    expect(all[0].route).toBe('/api/users');
    expect(all[0].action).toBe('registered');
    expect(typeof all[0].timestamp).toBe('number');
  });

  it('returns a copy from getAll so internal state is not mutated', () => {
    const log = createRouteChangeLog();
    log.record(makeEvent());
    const all = log.getAll();
    all.pop();
    expect(log.size()).toBe(1);
  });

  it('filters by route', () => {
    const log = createRouteChangeLog();
    log.record(makeEvent({ route: '/api/users' }));
    log.record(makeEvent({ route: '/api/posts' }));
    const results = log.getByRoute('/api/users');
    expect(results).toHaveLength(1);
    expect(results[0].route).toBe('/api/users');
  });

  it('filters by action', () => {
    const log = createRouteChangeLog();
    log.record(makeEvent({ action: 'registered' }));
    log.record(makeEvent({ action: 'deprecated' }));
    log.record(makeEvent({ action: 'deprecated' }));
    expect(log.getByAction('deprecated')).toHaveLength(2);
    expect(log.getByAction('registered')).toHaveLength(1);
  });

  it('filters events since a timestamp', () => {
    const log = createRouteChangeLog();
    const before = Date.now() - 1000;
    log.record(makeEvent({ route: '/old' }));
    const mid = Date.now();
    log.record(makeEvent({ route: '/new' }));
    const results = log.since(mid);
    expect(results.every((e) => e.timestamp >= mid)).toBe(true);
    const all = log.since(before);
    expect(all.length).toBeGreaterThanOrEqual(1);
  });

  it('clears all entries', () => {
    const log = createRouteChangeLog();
    log.record(makeEvent());
    log.record(makeEvent());
    log.clear();
    expect(log.size()).toBe(0);
  });

  it('enforces maxEntries cap by evicting oldest entries', () => {
    const log = createRouteChangeLog(3);
    log.record(makeEvent({ route: '/a' }));
    log.record(makeEvent({ route: '/b' }));
    log.record(makeEvent({ route: '/c' }));
    log.record(makeEvent({ route: '/d' }));
    expect(log.size()).toBe(3);
    const routes = log.getAll().map((e) => e.route);
    expect(routes).not.toContain('/a');
    expect(routes).toContain('/d');
  });

  it('stores optional meta on events', () => {
    const log = createRouteChangeLog();
    log.record(makeEvent({ meta: { reason: 'v2 rollout' } }));
    expect(log.getAll()[0].meta).toEqual({ reason: 'v2 rollout' });
  });
});
