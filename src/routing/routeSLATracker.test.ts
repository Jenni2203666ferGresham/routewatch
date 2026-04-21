import { createSLATracker, SLATarget } from './routeSLATracker';

const baseTarget: SLATarget = {
  route: '/api/users',
  method: 'GET',
  maxLatencyP99Ms: 200,
  maxErrorRatePct: 5,
  minUptimePct: 99,
};

describe('createSLATracker', () => {
  it('adds and retrieves a target', () => {
    const tracker = createSLATracker();
    tracker.addTarget(baseTarget);
    expect(tracker.getTarget('/api/users', 'GET')).toEqual(baseTarget);
  });

  it('returns undefined for unknown target', () => {
    const tracker = createSLATracker();
    expect(tracker.getTarget('/missing', 'GET')).toBeUndefined();
  });

  it('removes a target', () => {
    const tracker = createSLATracker();
    tracker.addTarget(baseTarget);
    tracker.removeTarget('/api/users', 'GET');
    expect(tracker.getTarget('/api/users', 'GET')).toBeUndefined();
  });

  it('returns null evaluate for unknown route', () => {
    const tracker = createSLATracker();
    expect(tracker.evaluate('/none', 'GET', 100, 0, 100)).toBeNull();
  });

  it('evaluates passing SLA', () => {
    const tracker = createSLATracker();
    tracker.addTarget(baseTarget);
    const status = tracker.evaluate('/api/users', 'GET', 150, 2, 99.5);
    expect(status).not.toBeNull();
    expect(status!.passing).toBe(true);
    expect(status!.latencyOk).toBe(true);
    expect(status!.errorRateOk).toBe(true);
    expect(status!.uptimeOk).toBe(true);
  });

  it('evaluates failing latency SLA', () => {
    const tracker = createSLATracker();
    tracker.addTarget(baseTarget);
    const status = tracker.evaluate('/api/users', 'GET', 300, 2, 99.5);
    expect(status!.latencyOk).toBe(false);
    expect(status!.passing).toBe(false);
  });

  it('evaluates failing error rate SLA', () => {
    const tracker = createSLATracker();
    tracker.addTarget(baseTarget);
    const status = tracker.evaluate('/api/users', 'GET', 100, 10, 99.5);
    expect(status!.errorRateOk).toBe(false);
    expect(status!.passing).toBe(false);
  });

  it('evaluates failing uptime SLA', () => {
    const tracker = createSLATracker();
    tracker.addTarget(baseTarget);
    const status = tracker.evaluate('/api/users', 'GET', 100, 2, 95);
    expect(status!.uptimeOk).toBe(false);
    expect(status!.passing).toBe(false);
  });

  it('evaluateAll skips unknown routes', () => {
    const tracker = createSLATracker();
    tracker.addTarget(baseTarget);
    const results = tracker.evaluateAll([
      { route: '/api/users', method: 'GET', p99Ms: 100, errorRatePct: 1, uptimePct: 100 },
      { route: '/unknown', method: 'POST', p99Ms: 100, errorRatePct: 1, uptimePct: 100 },
    ]);
    expect(results).toHaveLength(1);
    expect(results[0].route).toBe('/api/users');
  });

  it('getTargets returns all targets', () => {
    const tracker = createSLATracker();
    tracker.addTarget(baseTarget);
    tracker.addTarget({ ...baseTarget, route: '/api/posts', method: 'POST' });
    expect(tracker.getTargets()).toHaveLength(2);
  });
});
