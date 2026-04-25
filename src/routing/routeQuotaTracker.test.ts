import { createRouteQuotaTracker } from './routeQuotaTracker';

describe('createRouteQuotaTracker', () => {
  it('returns empty list when no routes configured', () => {
    const tracker = createRouteQuotaTracker();
    expect(tracker.getAll()).toEqual([]);
  });

  it('records usage and decrements remaining', () => {
    const tracker = createRouteQuotaTracker();
    tracker.configure('/api/items', 'GET', 5, 60_000);
    tracker.record('/api/items', 'GET');
    tracker.record('/api/items', 'GET');
    const entries = tracker.getByRoute('/api/items');
    expect(entries).toHaveLength(1);
    expect(entries[0].used).toBe(2);
    expect(entries[0].remaining).toBe(3);
    expect(entries[0].exceeded).toBe(false);
  });

  it('marks exceeded when usage surpasses limit', () => {
    const tracker = createRouteQuotaTracker();
    tracker.configure('/api/items', 'POST', 2, 60_000);
    tracker.record('/api/items', 'POST');
    tracker.record('/api/items', 'POST');
    tracker.record('/api/items', 'POST');
    expect(tracker.isExceeded('/api/items', 'POST')).toBe(true);
    const entry = tracker.getByRoute('/api/items')[0];
    expect(entry.exceeded).toBe(true);
    expect(entry.remaining).toBe(0);
  });

  it('does not track unconfigured routes', () => {
    const tracker = createRouteQuotaTracker();
    tracker.record('/unknown', 'GET');
    expect(tracker.isExceeded('/unknown', 'GET')).toBe(false);
    expect(tracker.getAll()).toHaveLength(0);
  });

  it('resets a single route bucket', () => {
    const tracker = createRouteQuotaTracker();
    tracker.configure('/api/data', 'GET', 3, 60_000);
    tracker.record('/api/data', 'GET');
    tracker.record('/api/data', 'GET');
    tracker.record('/api/data', 'GET');
    expect(tracker.isExceeded('/api/data', 'GET')).toBe(true);
    tracker.reset('/api/data', 'GET');
    expect(tracker.isExceeded('/api/data', 'GET')).toBe(false);
    expect(tracker.getByRoute('/api/data')[0].used).toBe(0);
  });

  it('resetAll clears all buckets', () => {
    const tracker = createRouteQuotaTracker();
    tracker.configure('/a', 'GET', 1, 60_000);
    tracker.configure('/b', 'POST', 1, 60_000);
    tracker.record('/a', 'GET');
    tracker.record('/a', 'GET');
    tracker.record('/b', 'POST');
    tracker.record('/b', 'POST');
    tracker.resetAll();
    expect(tracker.isExceeded('/a', 'GET')).toBe(false);
    expect(tracker.isExceeded('/b', 'POST')).toBe(false);
  });

  it('getAll returns entries for all configured routes', () => {
    const tracker = createRouteQuotaTracker();
    tracker.configure('/x', 'GET', 10, 60_000);
    tracker.configure('/y', 'DELETE', 5, 60_000);
    const all = tracker.getAll();
    expect(all).toHaveLength(2);
    const routes = all.map((e) => e.route);
    expect(routes).toContain('/x');
    expect(routes).toContain('/y');
  });
});
