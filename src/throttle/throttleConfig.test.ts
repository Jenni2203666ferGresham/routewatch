import { buildThrottleConfig, validateThrottleConfig } from './throttleConfig';

describe('buildThrottleConfig', () => {
  it('returns defaults when no options provided', () => {
    const config = buildThrottleConfig({});
    expect(config.maxRequests).toBeGreaterThan(0);
    expect(config.windowMs).toBeGreaterThan(0);
    expect(config.perIp).toBe(false);
  });

  it('applies provided values', () => {
    const config = buildThrottleConfig({ maxRequests: 10, windowMs: 5000, perIp: true });
    expect(config.maxRequests).toBe(10);
    expect(config.windowMs).toBe(5000);
    expect(config.perIp).toBe(true);
  });

  it('partial overrides keep defaults for missing fields', () => {
    const config = buildThrottleConfig({ maxRequests: 3 });
    expect(config.maxRequests).toBe(3);
    expect(typeof config.windowMs).toBe('number');
  });
});

describe('validateThrottleConfig', () => {
  it('accepts valid config', () => {
    expect(() =>
      validateThrottleConfig({ maxRequests: 5, windowMs: 1000, perIp: false })
    ).not.toThrow();
  });

  it('throws when maxRequests is zero', () => {
    expect(() =>
      validateThrottleConfig({ maxRequests: 0, windowMs: 1000, perIp: false })
    ).toThrow();
  });

  it('throws when maxRequests is negative', () => {
    expect(() =>
      validateThrottleConfig({ maxRequests: -1, windowMs: 1000, perIp: false })
    ).toThrow();
  });

  it('throws when windowMs is zero', () => {
    expect(() =>
      validateThrottleConfig({ maxRequests: 5, windowMs: 0, perIp: false })
    ).toThrow();
  });

  it('throws when windowMs is negative', () => {
    expect(() =>
      validateThrottleConfig({ maxRequests: 5, windowMs: -100, perIp: false })
    ).toThrow();
  });
});
