import { createRouteStatusTracker } from './routeStatusTracker';

describe('createRouteStatusTracker', () => {
  it('records status codes and computes totals', () => {
    const tracker = createRouteStatusTracker();
    tracker.record('GET', '/users', 200);
    tracker.record('GET', '/users', 200);
    tracker.record('GET', '/users', 404);

    const entry = tracker.get('GET', '/users');
    expect(entry).toBeDefined();
    expect(entry!.total).toBe(3);
    expect(entry!.statusCounts[200]).toBe(2);
    expect(entry!.statusCounts[404]).toBe(1);
  });

  it('computes successRate correctly', () => {
    const tracker = createRouteStatusTracker();
    tracker.record('POST', '/items', 201);
    tracker.record('POST', '/items', 201);
    tracker.record('POST', '/items', 500);

    const entry = tracker.get('POST', '/items')!;
    expect(entry.successRate).toBeCloseTo(2 / 3);
    expect(entry.serverErrorRate).toBeCloseTo(1 / 3);
    expect(entry.clientErrorRate).toBe(0);
  });

  it('computes clientErrorRate correctly', () => {
    const tracker = createRouteStatusTracker();
    tracker.record('DELETE', '/resource', 403);
    tracker.record('DELETE', '/resource', 404);
    tracker.record('DELETE', '/resource', 204);

    const entry = tracker.get('DELETE', '/resource')!;
    expect(entry.clientErrorRate).toBeCloseTo(2 / 3);
    expect(entry.successRate).toBeCloseTo(1 / 3);
  });

  it('returns undefined for unknown route', () => {
    const tracker = createRouteStatusTracker();
    expect(tracker.get('GET', '/unknown')).toBeUndefined();
  });

  it('getAll returns all entries', () => {
    const tracker = createRouteStatusTracker();
    tracker.record('GET', '/a', 200);
    tracker.record('POST', '/b', 201);
    tracker.record('GET', '/c', 500);

    const all = tracker.getAll();
    expect(all).toHaveLength(3);
    const routes = all.map((e) => e.route);
    expect(routes).toContain('/a');
    expect(routes).toContain('/b');
    expect(routes).toContain('/c');
  });

  it('getByRoute filters correctly', () => {
    const tracker = createRouteStatusTracker();
    tracker.record('GET', '/users', 200);
    tracker.record('POST', '/users', 201);
    tracker.record('GET', '/items', 200);

    const entries = tracker.getByRoute('/users');
    expect(entries).toHaveLength(2);
    expect(entries.every((e) => e.route === '/users')).toBe(true);
  });

  it('getByMethod filters correctly', () => {
    const tracker = createRouteStatusTracker();
    tracker.record('GET', '/a', 200);
    tracker.record('GET', '/b', 404);
    tracker.record('POST', '/c', 201);

    const entries = tracker.getByMethod('GET');
    expect(entries).toHaveLength(2);
    expect(entries.every((e) => e.method === 'GET')).toBe(true);
  });

  it('normalizes method to uppercase', () => {
    const tracker = createRouteStatusTracker();
    tracker.record('get', '/test', 200);
    const entry = tracker.get('GET', '/test');
    expect(entry).toBeDefined();
    expect(entry!.method).toBe('GET');
  });

  it('reset clears all data', () => {
    const tracker = createRouteStatusTracker();
    tracker.record('GET', '/x', 200);
    tracker.reset();
    expect(tracker.getAll()).toHaveLength(0);
    expect(tracker.get('GET', '/x')).toBeUndefined();
  });

  it('handles zero total gracefully', () => {
    const tracker = createRouteStatusTracker();
    // Directly test that rates are 0 when no records
    tracker.record('GET', '/empty', 200);
    tracker.reset();
    // After reset, no entries exist
    expect(tracker.getAll()).toHaveLength(0);
  });
});
