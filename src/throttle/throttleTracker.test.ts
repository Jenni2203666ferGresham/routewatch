import { createThrottleTracker } from './throttleTracker';

describe('createThrottleTracker', () => {
  it('starts with zeroed stats for a new route', () => {
    const tracker = createThrottleTracker();
    const stats = tracker.getStats('/api/test');
    expect(stats).toEqual({ route: '/api/test', active: 0, queued: 0, rejected: 0, completed: 0 });
  });

  it('increments active on acquire', () => {
    const tracker = createThrottleTracker();
    tracker.acquire('/api/test');
    tracker.acquire('/api/test');
    expect(tracker.getStats('/api/test').active).toBe(2);
  });

  it('decrements active and increments completed on release', () => {
    const tracker = createThrottleTracker();
    tracker.acquire('/api/test');
    tracker.release('/api/test');
    const stats = tracker.getStats('/api/test');
    expect(stats.active).toBe(0);
    expect(stats.completed).toBe(1);
  });

  it('active does not go below zero on extra release', () => {
    const tracker = createThrottleTracker();
    tracker.release('/api/test');
    expect(tracker.getStats('/api/test').active).toBe(0);
  });

  it('increments rejected on reject', () => {
    const tracker = createThrottleTracker();
    tracker.reject('/api/test');
    tracker.reject('/api/test');
    expect(tracker.getStats('/api/test').rejected).toBe(2);
  });

  it('getAllStats returns all tracked routes', () => {
    const tracker = createThrottleTracker();
    tracker.acquire('/a');
    tracker.acquire('/b');
    tracker.reject('/c');
    const all = tracker.getAllStats();
    expect(all.map(s => s.route).sort()).toEqual(['/a', '/b', '/c']);
  });

  it('reset clears all state', () => {
    const tracker = createThrottleTracker();
    tracker.acquire('/api/test');
    tracker.reject('/api/test');
    tracker.reset();
    expect(tracker.getAllStats()).toHaveLength(0);
  });

  it('tracks separate state per route', () => {
    const tracker = createThrottleTracker();
    tracker.acquire('/a');
    tracker.acquire('/a');
    tracker.acquire('/b');
    expect(tracker.getStats('/a').active).toBe(2);
    expect(tracker.getStats('/b').active).toBe(1);
  });
});
