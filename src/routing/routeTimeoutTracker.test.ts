import { createRouteTimeoutTracker } from './routeTimeoutTracker';

describe('createRouteTimeoutTracker', () => {
  it('records a non-timeout event', () => {
    const tracker = createRouteTimeoutTracker();
    tracker.record('GET', '/users', false);
    const all = tracker.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].total).toBe(1);
    expect(all[0].timeouts).toBe(0);
    expect(all[0].timeoutRate).toBe(0);
    expect(all[0].lastTimeoutAt).toBeNull();
  });

  it('records a timeout event', () => {
    const tracker = createRouteTimeoutTracker();
    tracker.record('POST', '/upload', true);
    const entry = tracker.getByMethod('POST', '/upload');
    expect(entry).toBeDefined();
    expect(entry!.timeouts).toBe(1);
    expect(entry!.total).toBe(1);
    expect(entry!.timeoutRate).toBe(1);
    expect(entry!.lastTimeoutAt).not.toBeNull();
  });

  it('computes timeout rate correctly', () => {
    const tracker = createRouteTimeoutTracker();
    tracker.record('GET', '/api', false);
    tracker.record('GET', '/api', false);
    tracker.record('GET', '/api', true);
    const entry = tracker.getByMethod('GET', '/api');
    expect(entry!.total).toBe(3);
    expect(entry!.timeouts).toBe(1);
    expect(entry!.timeoutRate).toBeCloseTo(1 / 3);
  });

  it('tracks separate method+route combos independently', () => {
    const tracker = createRouteTimeoutTracker();
    tracker.record('GET', '/items', true);
    tracker.record('POST', '/items', false);
    const all = tracker.getAll();
    expect(all).toHaveLength(2);
  });

  it('getByRoute returns all methods for a route', () => {
    const tracker = createRouteTimeoutTracker();
    tracker.record('GET', '/orders', false);
    tracker.record('DELETE', '/orders', true);
    const entries = tracker.getByRoute('/orders');
    expect(entries).toHaveLength(2);
    expect(entries.map((e) => e.method).sort()).toEqual(['DELETE', 'GET']);
  });

  it('returns undefined for unknown method+route', () => {
    const tracker = createRouteTimeoutTracker();
    expect(tracker.getByMethod('PUT', '/missing')).toBeUndefined();
  });

  it('resets all data', () => {
    const tracker = createRouteTimeoutTracker();
    tracker.record('GET', '/ping', true);
    tracker.reset();
    expect(tracker.getAll()).toHaveLength(0);
  });

  it('normalises method to uppercase', () => {
    const tracker = createRouteTimeoutTracker();
    tracker.record('get', '/health', false);
    const entry = tracker.getByMethod('GET', '/health');
    expect(entry).toBeDefined();
    expect(entry!.method).toBe('GET');
  });
});
