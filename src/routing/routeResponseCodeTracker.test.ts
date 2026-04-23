import { createRouteResponseCodeTracker } from './routeResponseCodeTracker';

describe('createRouteResponseCodeTracker', () => {
  it('records a new entry', () => {
    const tracker = createRouteResponseCodeTracker();
    tracker.record('GET', '/users', 200);
    const all = tracker.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].count).toBe(1);
    expect(all[0].statusCode).toBe(200);
  });

  it('increments count for duplicate entries', () => {
    const tracker = createRouteResponseCodeTracker();
    tracker.record('GET', '/users', 200);
    tracker.record('GET', '/users', 200);
    const all = tracker.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].count).toBe(2);
  });

  it('tracks different status codes separately', () => {
    const tracker = createRouteResponseCodeTracker();
    tracker.record('GET', '/users', 200);
    tracker.record('GET', '/users', 404);
    expect(tracker.getAll()).toHaveLength(2);
  });

  it('getByRoute returns only matching entries', () => {
    const tracker = createRouteResponseCodeTracker();
    tracker.record('GET', '/users', 200);
    tracker.record('POST', '/users', 201);
    tracker.record('GET', '/posts', 200);
    const results = tracker.getByRoute('GET', '/users');
    expect(results).toHaveLength(1);
    expect(results[0].method).toBe('GET');
    expect(results[0].route).toBe('/users');
  });

  it('getByStatusCode returns all entries with that code', () => {
    const tracker = createRouteResponseCodeTracker();
    tracker.record('GET', '/users', 200);
    tracker.record('GET', '/posts', 200);
    tracker.record('GET', '/users', 404);
    expect(tracker.getByStatusCode(200)).toHaveLength(2);
    expect(tracker.getByStatusCode(404)).toHaveLength(1);
  });

  it('getSummary returns counts keyed by status code', () => {
    const tracker = createRouteResponseCodeTracker();
    tracker.record('GET', '/users', 200);
    tracker.record('GET', '/users', 200);
    tracker.record('GET', '/users', 500);
    const summary = tracker.getSummary('GET', '/users');
    expect(summary[200]).toBe(2);
    expect(summary[500]).toBe(1);
  });

  it('reset clears all entries', () => {
    const tracker = createRouteResponseCodeTracker();
    tracker.record('GET', '/users', 200);
    tracker.reset();
    expect(tracker.getAll()).toHaveLength(0);
  });

  it('normalizes method to uppercase', () => {
    const tracker = createRouteResponseCodeTracker();
    tracker.record('get', '/users', 200);
    const all = tracker.getAll();
    expect(all[0].method).toBe('GET');
  });
});
