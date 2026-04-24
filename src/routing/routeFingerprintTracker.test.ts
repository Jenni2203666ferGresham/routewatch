import { createRouteFingerprintTracker } from './routeFingerprintTracker';

describe('createRouteFingerprintTracker', () => {
  it('records a new fingerprint entry', () => {
    const tracker = createRouteFingerprintTracker();
    tracker.record('GET', '/users', 'abc123');
    const entry = tracker.getByRoute('GET', '/users');
    expect(entry).toBeDefined();
    expect(entry!.fingerprint).toBe('abc123');
    expect(entry!.hitCount).toBe(1);
  });

  it('increments hitCount on repeated records', () => {
    const tracker = createRouteFingerprintTracker();
    tracker.record('GET', '/users', 'abc123');
    tracker.record('GET', '/users', 'abc123');
    const entry = tracker.getByRoute('GET', '/users');
    expect(entry!.hitCount).toBe(2);
  });

  it('updates fingerprint when it changes', () => {
    const tracker = createRouteFingerprintTracker();
    tracker.record('POST', '/items', 'fp1');
    tracker.record('POST', '/items', 'fp2');
    const entry = tracker.getByRoute('POST', '/items');
    expect(entry!.fingerprint).toBe('fp2');
  });

  it('detects fingerprint change via hasChanged', () => {
    const tracker = createRouteFingerprintTracker();
    tracker.record('GET', '/data', 'fp_original');
    expect(tracker.hasChanged('GET', '/data', 'fp_original')).toBe(false);
    expect(tracker.hasChanged('GET', '/data', 'fp_new')).toBe(true);
  });

  it('returns false from hasChanged for unknown routes', () => {
    const tracker = createRouteFingerprintTracker();
    expect(tracker.hasChanged('GET', '/unknown', 'any')).toBe(false);
  });

  it('looks up by fingerprint', () => {
    const tracker = createRouteFingerprintTracker();
    tracker.record('DELETE', '/resource', 'del_fp');
    const entry = tracker.getByFingerprint('del_fp');
    expect(entry).toBeDefined();
    expect(entry!.route).toBe('/resource');
  });

  it('returns undefined for unknown fingerprint', () => {
    const tracker = createRouteFingerprintTracker();
    expect(tracker.getByFingerprint('nope')).toBeUndefined();
  });

  it('getAll returns all entries', () => {
    const tracker = createRouteFingerprintTracker();
    tracker.record('GET', '/a', 'fp_a');
    tracker.record('POST', '/b', 'fp_b');
    expect(tracker.getAll()).toHaveLength(2);
  });

  it('reset clears all data', () => {
    const tracker = createRouteFingerprintTracker();
    tracker.record('GET', '/x', 'fp_x');
    tracker.reset();
    expect(tracker.getAll()).toHaveLength(0);
    expect(tracker.getByFingerprint('fp_x')).toBeUndefined();
  });

  it('normalizes method to uppercase', () => {
    const tracker = createRouteFingerprintTracker();
    tracker.record('get', '/lower', 'fp');
    const entry = tracker.getByRoute('GET', '/lower');
    expect(entry!.method).toBe('GET');
  });
});
