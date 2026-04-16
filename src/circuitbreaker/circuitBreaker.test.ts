import { createCircuitBreaker } from './circuitBreaker';

const config = { failureThreshold: 3, successThreshold: 2, timeout: 1000 };

describe('createCircuitBreaker', () => {
  it('starts in closed state', () => {
    const cb = createCircuitBreaker(config);
    expect(cb.getState('/api/test')).toBe('closed');
  });

  it('trips to open after failure threshold', () => {
    const cb = createCircuitBreaker(config);
    cb.record('/api/test', false);
    cb.record('/api/test', false);
    expect(cb.getState('/api/test')).toBe('closed');
    cb.record('/api/test', false);
    expect(cb.getState('/api/test')).toBe('open');
  });

  it('resets failure count on success', () => {
    const cb = createCircuitBreaker(config);
    cb.record('/api/test', false);
    cb.record('/api/test', false);
    cb.record('/api/test', true);
    cb.record('/api/test', false);
    cb.record('/api/test', false);
    expect(cb.getState('/api/test')).toBe('closed');
  });

  it('transitions to half-open after timeout', () => {
    const cb = createCircuitBreaker({ ...config, timeout: 0 });
    cb.record('/api/test', false);
    cb.record('/api/test', false);
    cb.record('/api/test', false);
    expect(cb.getState('/api/test')).toBe('half-open');
  });

  it('closes from half-open after success threshold', () => {
    const cb = createCircuitBreaker({ ...config, timeout: 0 });
    [false, false, false].forEach(() => cb.record('/api/test', false));
    cb.record('/api/test', true);
    cb.record('/api/test', true);
    expect(cb.getState('/api/test')).toBe('closed');
  });

  it('tracks stats correctly', () => {
    const cb = createCircuitBreaker(config);
    cb.record('/api/x', false);
    cb.record('/api/x', false);
    const stats = cb.getStats('/api/x');
    expect(stats.failures).toBe(2);
    expect(stats.state).toBe('closed');
    expect(stats.lastFailureAt).not.toBeNull();
  });

  it('reset clears state', () => {
    const cb = createCircuitBreaker(config);
    cb.record('/api/x', false);
    cb.record('/api/x', false);
    cb.record('/api/x', false);
    cb.reset('/api/x');
    expect(cb.getState('/api/x')).toBe('closed');
    expect(cb.getStats('/api/x').failures).toBe(0);
  });

  it('getAllStats returns all routes', () => {
    const cb = createCircuitBreaker(config);
    cb.record('/a', true);
    cb.record('/b', false);
    const all = cb.getAllStats();
    expect(all.map(s => s.route).sort()).toEqual(['/a', '/b']);
  });
});
