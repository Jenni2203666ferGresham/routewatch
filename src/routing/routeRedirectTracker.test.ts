import { createRouteRedirectTracker } from './routeRedirectTracker';

describe('createRouteRedirectTracker', () => {
  it('records a redirect entry', () => {
    const tracker = createRouteRedirectTracker();
    tracker.record('GET', '/old', '/new', 301);
    const all = tracker.getAll();
    expect(all).toHaveLength(1);
    expect(all[0]).toMatchObject({
      method: 'GET',
      fromRoute: '/old',
      toRoute: '/new',
      statusCode: 301,
      count: 1,
    });
  });

  it('increments count for duplicate redirects', () => {
    const tracker = createRouteRedirectTracker();
    tracker.record('GET', '/old', '/new', 301);
    tracker.record('GET', '/old', '/new', 301);
    expect(tracker.getAll()[0].count).toBe(2);
  });

  it('treats different methods as separate entries', () => {
    const tracker = createRouteRedirectTracker();
    tracker.record('GET', '/old', '/new', 301);
    tracker.record('POST', '/old', '/new', 301);
    expect(tracker.getAll()).toHaveLength(2);
  });

  it('getByFromRoute returns matching entries', () => {
    const tracker = createRouteRedirectTracker();
    tracker.record('GET', '/a', '/b', 302);
    tracker.record('GET', '/c', '/d', 302);
    expect(tracker.getByFromRoute('/a')).toHaveLength(1);
    expect(tracker.getByFromRoute('/c')[0].toRoute).toBe('/d');
  });

  it('getByToRoute returns matching entries', () => {
    const tracker = createRouteRedirectTracker();
    tracker.record('GET', '/a', '/b', 302);
    tracker.record('GET', '/x', '/b', 302);
    expect(tracker.getByToRoute('/b')).toHaveLength(2);
  });

  it('getChains resolves redirect chains', () => {
    const tracker = createRouteRedirectTracker();
    tracker.record('GET', '/a', '/b', 301);
    tracker.record('GET', '/b', '/c', 301);
    const chains = tracker.getChains();
    expect(chains).toContainEqual(['/a', '/b', '/c']);
  });

  it('reset clears all entries', () => {
    const tracker = createRouteRedirectTracker();
    tracker.record('GET', '/old', '/new', 301);
    tracker.reset();
    expect(tracker.getAll()).toHaveLength(0);
  });
});
