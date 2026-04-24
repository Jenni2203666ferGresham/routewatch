import { createRouteCacheTracker } from './routeCacheTracker';

describe('createRouteCacheTracker', () => {
  it('starts with no entries', () => {
    const tracker = createRouteCacheTracker();
    expect(tracker.getAll()).toEqual([]);
  });

  it('records hits and misses', () => {
    const tracker = createRouteCacheTracker();
    tracker.recordHit('GET', '/api/users');
    tracker.recordHit('GET', '/api/users');
    tracker.recordMiss('GET', '/api/users');

    const all = tracker.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].hits).toBe(2);
    expect(all[0].misses).toBe(1);
  });

  it('computes hitRate correctly', () => {
    const tracker = createRouteCacheTracker();
    tracker.recordHit('GET', '/api/items');
    tracker.recordHit('GET', '/api/items');
    tracker.recordHit('GET', '/api/items');
    tracker.recordMiss('GET', '/api/items');

    const entry = tracker.getAll()[0];
    expect(entry.hitRate).toBeCloseTo(0.75);
  });

  it('returns hitRate 0 when no events recorded', () => {
    const tracker = createRouteCacheTracker();
    // Force entry creation via a miss
    tracker.recordMiss('POST', '/api/data');
    const entry = tracker.getAll().find((e) => e.route === '/api/data');
    expect(entry?.hitRate).toBe(0);
  });

  it('tracks multiple routes independently', () => {
    const tracker = createRouteCacheTracker();
    tracker.recordHit('GET', '/a');
    tracker.recordMiss('POST', '/b');

    const all = tracker.getAll();
    expect(all).toHaveLength(2);
  });

  it('getByRoute filters correctly', () => {
    const tracker = createRouteCacheTracker();
    tracker.recordHit('GET', '/api/x');
    tracker.recordHit('POST', '/api/x');
    tracker.recordHit('GET', '/api/y');

    const results = tracker.getByRoute('/api/x');
    expect(results).toHaveLength(2);
    expect(results.every((e) => e.route === '/api/x')).toBe(true);
  });

  it('resets all entries', () => {
    const tracker = createRouteCacheTracker();
    tracker.recordHit('GET', '/api/reset');
    tracker.reset();
    expect(tracker.getAll()).toHaveLength(0);
  });

  it('records lastAccessed timestamp', () => {
    const before = Date.now();
    const tracker = createRouteCacheTracker();
    tracker.recordHit('GET', '/ts');
    const after = Date.now();
    const entry = tracker.getAll()[0];
    expect(entry.lastAccessed).toBeGreaterThanOrEqual(before);
    expect(entry.lastAccessed).toBeLessThanOrEqual(after);
  });
});
