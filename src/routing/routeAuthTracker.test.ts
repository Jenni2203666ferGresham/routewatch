import { createRouteAuthTracker, AuthEvent } from './routeAuthTracker';

function makeEvent(overrides: Partial<AuthEvent> = {}): AuthEvent {
  return {
    method: 'GET',
    route: '/api/data',
    authenticated: true,
    userId: 'user-1',
    timestamp: Date.now(),
    ...overrides,
  };
}

describe('createRouteAuthTracker', () => {
  it('records an authenticated event', () => {
    const tracker = createRouteAuthTracker();
    tracker.record(makeEvent());
    const stats = tracker.getByRoute('GET', '/api/data');
    expect(stats).toBeDefined();
    expect(stats!.total).toBe(1);
    expect(stats!.authenticated).toBe(1);
    expect(stats!.unauthenticated).toBe(0);
  });

  it('records an unauthenticated event', () => {
    const tracker = createRouteAuthTracker();
    tracker.record(makeEvent({ authenticated: false, userId: undefined }));
    const stats = tracker.getByRoute('GET', '/api/data');
    expect(stats!.unauthenticated).toBe(1);
    expect(stats!.authenticated).toBe(0);
  });

  it('computes authRate correctly', () => {
    const tracker = createRouteAuthTracker();
    tracker.record(makeEvent({ authenticated: true }));
    tracker.record(makeEvent({ authenticated: true }));
    tracker.record(makeEvent({ authenticated: false, userId: undefined }));
    const stats = tracker.getByRoute('GET', '/api/data');
    expect(stats!.authRate).toBeCloseTo(2 / 3);
  });

  it('tracks unique users', () => {
    const tracker = createRouteAuthTracker();
    tracker.record(makeEvent({ userId: 'user-1' }));
    tracker.record(makeEvent({ userId: 'user-2' }));
    tracker.record(makeEvent({ userId: 'user-1' }));
    const stats = tracker.getByRoute('GET', '/api/data');
    expect(stats!.uniqueUsers.size).toBe(2);
  });

  it('returns all stats', () => {
    const tracker = createRouteAuthTracker();
    tracker.record(makeEvent({ route: '/a' }));
    tracker.record(makeEvent({ route: '/b' }));
    expect(tracker.getAll()).toHaveLength(2);
  });

  it('returns unauthenticated routes only', () => {
    const tracker = createRouteAuthTracker();
    tracker.record(makeEvent({ route: '/secure', authenticated: true }));
    tracker.record(makeEvent({ route: '/open', authenticated: false, userId: undefined }));
    const unauth = tracker.getUnauthenticated();
    expect(unauth).toHaveLength(1);
    expect(unauth[0].route).toBe('/open');
  });

  it('resets all data', () => {
    const tracker = createRouteAuthTracker();
    tracker.record(makeEvent());
    tracker.reset();
    expect(tracker.getAll()).toHaveLength(0);
  });

  it('returns undefined for unknown route', () => {
    const tracker = createRouteAuthTracker();
    expect(tracker.getByRoute('POST', '/missing')).toBeUndefined();
  });
});
