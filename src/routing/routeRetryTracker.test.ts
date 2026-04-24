import { createRouteRetryTracker, RetryEvent } from './routeRetryTracker';

function makeEvent(overrides: Partial<RetryEvent> = {}): RetryEvent {
  return {
    route: '/api/items',
    method: 'GET',
    retryCount: 0,
    timestamp: Date.now(),
    ...overrides,
  };
}

describe('createRouteRetryTracker', () => {
  it('records a request with no retries', () => {
    const tracker = createRouteRetryTracker();
    tracker.record(makeEvent({ retryCount: 0 }));
    const all = tracker.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].totalRequests).toBe(1);
    expect(all[0].totalRetries).toBe(0);
    expect(all[0].lastRetryAt).toBeNull();
  });

  it('records retries and updates maxRetriesSeen', () => {
    const tracker = createRouteRetryTracker();
    tracker.record(makeEvent({ retryCount: 2 }));
    tracker.record(makeEvent({ retryCount: 5 }));
    const entry = tracker.getAll()[0];
    expect(entry.totalRequests).toBe(2);
    expect(entry.totalRetries).toBe(7);
    expect(entry.maxRetriesSeen).toBe(5);
  });

  it('tracks separate entries per route+method', () => {
    const tracker = createRouteRetryTracker();
    tracker.record(makeEvent({ route: '/a', method: 'GET', retryCount: 1 }));
    tracker.record(makeEvent({ route: '/b', method: 'POST', retryCount: 3 }));
    expect(tracker.getAll()).toHaveLength(2);
  });

  it('getByRoute returns correct entries', () => {
    const tracker = createRouteRetryTracker();
    tracker.record(makeEvent({ route: '/x', method: 'GET' }));
    tracker.record(makeEvent({ route: '/y', method: 'GET' }));
    expect(tracker.getByRoute('/x')).toHaveLength(1);
    expect(tracker.getByRoute('/x')[0].route).toBe('/x');
  });

  it('getByMethod filters correctly', () => {
    const tracker = createRouteRetryTracker();
    tracker.record(makeEvent({ method: 'GET' }));
    tracker.record(makeEvent({ route: '/other', method: 'POST' }));
    expect(tracker.getByMethod('post')).toHaveLength(1);
    expect(tracker.getByMethod('post')[0].method).toBe('POST');
  });

  it('getRetryRate computes correct ratio', () => {
    const tracker = createRouteRetryTracker();
    tracker.record(makeEvent({ retryCount: 0 }));
    tracker.record(makeEvent({ retryCount: 2 }));
    tracker.record(makeEvent({ retryCount: 1 }));
    const rate = tracker.getRetryRate('/api/items', 'GET');
    expect(rate).toBeCloseTo(1.0); // 3 retries / 3 requests
  });

  it('getRetryRate returns 0 for unknown route', () => {
    const tracker = createRouteRetryTracker();
    expect(tracker.getRetryRate('/missing', 'GET')).toBe(0);
  });

  it('reset clears all entries', () => {
    const tracker = createRouteRetryTracker();
    tracker.record(makeEvent());
    tracker.reset();
    expect(tracker.getAll()).toHaveLength(0);
  });
});
