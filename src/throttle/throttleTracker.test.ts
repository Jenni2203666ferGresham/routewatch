import { createThrottleTracker } from './throttleTracker';
import { buildThrottleConfig } from './throttleConfig';

describe('createThrottleTracker', () => {
  it('allows requests under the limit', () => {
    const config = buildThrottleConfig({ maxRequests: 3, windowMs: 1000 });
    const tracker = createThrottleTracker(config);

    expect(tracker.isAllowed('route-a')).toBe(true);
    expect(tracker.isAllowed('route-a')).toBe(true);
    expect(tracker.isAllowed('route-a')).toBe(true);
  });

  it('blocks requests over the limit', () => {
    const config = buildThrottleConfig({ maxRequests: 2, windowMs: 1000 });
    const tracker = createThrottleTracker(config);

    tracker.isAllowed('route-b');
    tracker.isAllowed('route-b');
    expect(tracker.isAllowed('route-b')).toBe(false);
  });

  it('tracks different keys independently', () => {
    const config = buildThrottleConfig({ maxRequests: 1, windowMs: 1000 });
    const tracker = createThrottleTracker(config);

    expect(tracker.isAllowed('key-1')).toBe(true);
    expect(tracker.isAllowed('key-2')).toBe(true);
    expect(tracker.isAllowed('key-1')).toBe(false);
  });

  it('resets counts after the window expires', async () => {
    const config = buildThrottleConfig({ maxRequests: 1, windowMs: 50 });
    const tracker = createThrottleTracker(config);

    expect(tracker.isAllowed('route-c')).toBe(true);
    expect(tracker.isAllowed('route-c')).toBe(false);

    await new Promise((r) => setTimeout(r, 60));

    expect(tracker.isAllowed('route-c')).toBe(true);
  });

  it('returns current count via getCount', () => {
    const config = buildThrottleConfig({ maxRequests: 5, windowMs: 1000 });
    const tracker = createThrottleTracker(config);

    tracker.isAllowed('route-d');
    tracker.isAllowed('route-d');

    expect(tracker.getCount('route-d')).toBe(2);
  });

  it('returns 0 count for unknown key', () => {
    const config = buildThrottleConfig({ maxRequests: 5, windowMs: 1000 });
    const tracker = createThrottleTracker(config);

    expect(tracker.getCount('unknown')).toBe(0);
  });
});
