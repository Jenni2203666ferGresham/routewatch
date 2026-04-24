import { createRouteRequestCounter } from './routeRequestCounter';

describe('createRouteRequestCounter', () => {
  it('records a request and increments count', () => {
    const counter = createRouteRequestCounter();
    counter.record('GET', '/users');
    expect(counter.getCount('GET', '/users')).toBe(1);
    counter.record('GET', '/users');
    expect(counter.getCount('GET', '/users')).toBe(2);
  });

  it('tracks different method+route combinations independently', () => {
    const counter = createRouteRequestCounter();
    counter.record('GET', '/users');
    counter.record('POST', '/users');
    expect(counter.getCount('GET', '/users')).toBe(1);
    expect(counter.getCount('POST', '/users')).toBe(1);
  });

  it('getAll returns all entries', () => {
    const counter = createRouteRequestCounter();
    counter.record('GET', '/a');
    counter.record('DELETE', '/b');
    const all = counter.getAll();
    expect(all).toHaveLength(2);
  });

  it('getByRoute filters by route', () => {
    const counter = createRouteRequestCounter();
    counter.record('GET', '/users');
    counter.record('POST', '/users');
    counter.record('GET', '/posts');
    const results = counter.getByRoute('/users');
    expect(results).toHaveLength(2);
    expect(results.every((e) => e.route === '/users')).toBe(true);
  });

  it('getByMethod filters by method', () => {
    const counter = createRouteRequestCounter();
    counter.record('GET', '/a');
    counter.record('GET', '/b');
    counter.record('POST', '/a');
    const results = counter.getByMethod('GET');
    expect(results).toHaveLength(2);
  });

  it('getCount returns 0 for unknown route', () => {
    const counter = createRouteRequestCounter();
    expect(counter.getCount('GET', '/nope')).toBe(0);
  });

  it('reset clears all entries', () => {
    const counter = createRouteRequestCounter();
    counter.record('GET', '/users');
    counter.reset();
    expect(counter.getAll()).toHaveLength(0);
    expect(counter.getCount('GET', '/users')).toBe(0);
  });

  it('normalizes method to uppercase', () => {
    const counter = createRouteRequestCounter();
    counter.record('get', '/users');
    expect(counter.getCount('GET', '/users')).toBe(1);
    const all = counter.getAll();
    expect(all[0].method).toBe('GET');
  });

  it('sets lastSeenAt on record', () => {
    const before = Date.now();
    const counter = createRouteRequestCounter();
    counter.record('GET', '/ping');
    const after = Date.now();
    const entry = counter.getAll()[0];
    expect(entry.lastSeenAt).toBeGreaterThanOrEqual(before);
    expect(entry.lastSeenAt).toBeLessThanOrEqual(after);
  });
});
