import { createRateLimitTracker, RateLimitEvent } from './rateLimitTracker';

function makeEvent(overrides: Partial<RateLimitEvent> = {}): RateLimitEvent {
  return {
    route: '/api/users',
    method: 'GET',
    clientIp: '127.0.0.1',
    timestamp: Date.now(),
    limitHit: false,
    ...overrides,
  };
}

describe('createRateLimitTracker', () => {
  it('returns empty stats when no events recorded', () => {
    const tracker = createRateLimitTracker();
    expect(tracker.getStats()).toEqual([]);
  });

  it('records events and computes stats', () => {
    const tracker = createRateLimitTracker();
    tracker.record(makeEvent({ limitHit: false }));
    tracker.record(makeEvent({ limitHit: true }));
    tracker.record(makeEvent({ limitHit: true }));

    const stats = tracker.getStats();
    expect(stats).toHaveLength(1);
    expect(stats[0].totalRequests).toBe(3);
    expect(stats[0].limitHits).toBe(2);
    expect(stats[0].limitHitRate).toBeCloseTo(2 / 3);
  });

  it('counts unique clients correctly', () => {
    const tracker = createRateLimitTracker();
    tracker.record(makeEvent({ clientIp: '1.1.1.1' }));
    tracker.record(makeEvent({ clientIp: '2.2.2.2' }));
    tracker.record(makeEvent({ clientIp: '1.1.1.1' }));

    const stats = tracker.getStats();
    expect(stats[0].uniqueClients).toBe(2);
  });

  it('groups stats by method and route', () => {
    const tracker = createRateLimitTracker();
    tracker.record(makeEvent({ method: 'GET', route: '/a' }));
    tracker.record(makeEvent({ method: 'POST', route: '/a' }));

    const stats = tracker.getStats();
    expect(stats).toHaveLength(2);
  });

  it('getStatsForRoute returns correct entry', () => {
    const tracker = createRateLimitTracker();
    tracker.record(makeEvent({ route: '/health', method: 'GET' }));

    const result = tracker.getStatsForRoute('/health', 'GET');
    expect(result).toBeDefined();
    expect(result!.route).toBe('/health');
  });

  it('reset clears all events', () => {
    const tracker = createRateLimitTracker();
    tracker.record(makeEvent());
    tracker.reset();
    expect(tracker.getStats()).toEqual([]);
  });
});
