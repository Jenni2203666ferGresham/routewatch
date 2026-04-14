import { createCorrelationTracker } from './correlationTracker';
import { RouteMetric } from '../metrics/RouteMetrics';

function makeMetric(overrides: Partial<RouteMetric> = {}): RouteMetric {
  return {
    route: '/api/test',
    method: 'GET',
    statusCode: 200,
    latencyMs: 42,
    timestamp: Date.now(),
    ...overrides,
  };
}

describe('createCorrelationTracker', () => {
  it('records and retrieves by traceId', () => {
    const tracker = createCorrelationTracker();
    tracker.record('abc-123', makeMetric());
    const entry = tracker.getByTraceId('abc-123');
    expect(entry).toBeDefined();
    expect(entry?.traceId).toBe('abc-123');
    expect(entry?.route).toBe('/api/test');
  });

  it('returns undefined for unknown traceId', () => {
    const tracker = createCorrelationTracker();
    expect(tracker.getByTraceId('nope')).toBeUndefined();
  });

  it('retrieves entries by route', () => {
    const tracker = createCorrelationTracker();
    tracker.record('t1', makeMetric({ route: '/api/users' }));
    tracker.record('t2', makeMetric({ route: '/api/users' }));
    tracker.record('t3', makeMetric({ route: '/api/posts' }));
    expect(tracker.getByRoute('/api/users')).toHaveLength(2);
    expect(tracker.getByRoute('/api/posts')).toHaveLength(1);
    expect(tracker.getByRoute('/api/none')).toHaveLength(0);
  });

  it('stores tags alongside the entry', () => {
    const tracker = createCorrelationTracker();
    tracker.record('t1', makeMetric(), { userId: 'u42', env: 'prod' });
    const entry = tracker.getByTraceId('t1');
    expect(entry?.tags).toEqual({ userId: 'u42', env: 'prod' });
  });

  it('evicts oldest entry when maxEntries is exceeded', () => {
    const tracker = createCorrelationTracker(3);
    tracker.record('t1', makeMetric());
    tracker.record('t2', makeMetric());
    tracker.record('t3', makeMetric());
    tracker.record('t4', makeMetric());
    expect(tracker.size()).toBe(3);
    expect(tracker.getByTraceId('t1')).toBeUndefined();
    expect(tracker.getByTraceId('t4')).toBeDefined();
  });

  it('clears all entries', () => {
    const tracker = createCorrelationTracker();
    tracker.record('t1', makeMetric());
    tracker.record('t2', makeMetric());
    tracker.clear();
    expect(tracker.size()).toBe(0);
    expect(tracker.getAll()).toHaveLength(0);
  });

  it('getAll returns all recorded entries', () => {
    const tracker = createCorrelationTracker();
    tracker.record('t1', makeMetric());
    tracker.record('t2', makeMetric({ route: '/other' }));
    expect(tracker.getAll()).toHaveLength(2);
  });
});
