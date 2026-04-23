import { createRoutePayloadTracker } from './routePayloadTracker';

describe('createRoutePayloadTracker', () => {
  it('starts with no entries', () => {
    const tracker = createRoutePayloadTracker();
    expect(tracker.getAll()).toEqual([]);
  });

  it('records payload data for a route', () => {
    const tracker = createRoutePayloadTracker();
    tracker.record('/api/users', 'POST', 100, 200);

    const all = tracker.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].route).toBe('/api/users');
    expect(all[0].method).toBe('POST');
    expect(all[0].count).toBe(1);
    expect(all[0].totalRequestBytes).toBe(100);
    expect(all[0].totalResponseBytes).toBe(200);
  });

  it('accumulates multiple records for the same route+method', () => {
    const tracker = createRoutePayloadTracker();
    tracker.record('/api/users', 'GET', 0, 512);
    tracker.record('/api/users', 'GET', 0, 256);

    const entry = tracker.getAll()[0];
    expect(entry.count).toBe(2);
    expect(entry.totalResponseBytes).toBe(768);
  });

  it('tracks different route+method pairs independently', () => {
    const tracker = createRoutePayloadTracker();
    tracker.record('/a', 'GET', 10, 20);
    tracker.record('/b', 'POST', 30, 40);

    const all = tracker.getAll();
    expect(all).toHaveLength(2);
  });

  it('getByRoute returns only entries for the given route', () => {
    const tracker = createRoutePayloadTracker();
    tracker.record('/api/orders', 'GET', 0, 100);
    tracker.record('/api/orders', 'POST', 50, 200);
    tracker.record('/api/users', 'GET', 0, 80);

    const entries = tracker.getByRoute('/api/orders');
    expect(entries).toHaveLength(2);
    entries.forEach((e) => expect(e.route).toBe('/api/orders'));
  });

  it('reset clears all entries', () => {
    const tracker = createRoutePayloadTracker();
    tracker.record('/x', 'DELETE', 0, 0);
    tracker.reset();
    expect(tracker.getAll()).toEqual([]);
  });

  it('computes avgRequestBytes and avgResponseBytes', () => {
    const tracker = createRoutePayloadTracker();
    tracker.record('/api/data', 'PUT', 100, 400);
    tracker.record('/api/data', 'PUT', 200, 600);

    const entry = tracker.getAll()[0];
    expect(entry.avgRequestBytes).toBe(150);
    expect(entry.avgResponseBytes).toBe(500);
  });
});
