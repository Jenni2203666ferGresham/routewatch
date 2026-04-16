import { createDedupeTracker } from './dedupeTracker';
import { RouteMetric } from '../metrics/RouteMetrics';

function makeMetric(route: string, method = 'GET'): RouteMetric {
  return { route, method, latency: 50, statusCode: 200, timestamp: Date.now() };
}

describe('createDedupeTracker', () => {
  it('records a new entry', () => {
    const tracker = createDedupeTracker();
    const m = makeMetric('/health');
    const recorded = tracker.record(m);
    expect(recorded).toBe(true);
    expect(tracker.getAll()).toHaveLength(1);
  });

  it('returns false for duplicate within window', () => {
    const tracker = createDedupeTracker({ windowMs: 5000 });
    const m = makeMetric('/health');
    tracker.record(m);
    expect(tracker.record(m)).toBe(false);
  });

  it('getEntry returns the stored entry', () => {
    const tracker = createDedupeTracker();
    const m = makeMetric('/users', 'POST');
    tracker.record(m);
    const entry = tracker.getEntry('POST:/users');
    expect(entry).toBeDefined();
    expect(entry?.metric.route).toBe('/users');
  });

  it('evicts oldest when maxTracked exceeded', () => {
    const tracker = createDedupeTracker({ maxTracked: 2, windowMs: 60000 });
    tracker.record(makeMetric('/a'));
    tracker.record(makeMetric('/b'));
    tracker.record(makeMetric('/c'));
    expect(tracker.getAll()).toHaveLength(2);
  });

  it('clear removes all entries', () => {
    const tracker = createDedupeTracker();
    tracker.record(makeMetric('/x'));
    tracker.clear();
    expect(tracker.getAll()).toHaveLength(0);
  });
});
