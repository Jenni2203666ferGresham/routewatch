import { buildAlertConfig, validateAlertConfig, AlertConfig } from './alertConfig';

describe('buildAlertConfig', () => {
  it('returns default config when no input provided', () => {
    const config = buildAlertConfig();
    expect(config.enabled).toBe(true);
    expect(config.thresholds.maxLatencyMs).toBe(1000);
    expect(config.thresholds.maxErrorRate).toBe(0.05);
    expect(config.thresholds.minRequestCount).toBe(10);
    expect(config.notifyOnResolve).toBe(false);
    expect(config.cooldownMs).toBe(60000);
  });

  it('overrides defaults with provided values', () => {
    const config = buildAlertConfig({
      maxLatencyMs: 500,
      maxErrorRate: 0.1,
      cooldownMs: 30000,
    });
    expect(config.thresholds.maxLatencyMs).toBe(500);
    expect(config.thresholds.maxErrorRate).toBe(0.1);
    expect(config.cooldownMs).toBe(30000);
    expect(config.thresholds.minRequestCount).toBe(10);
  });

  it('allows disabling alerts', () => {
    const config = buildAlertConfig({ enabled: false });
    expect(config.enabled).toBe(false);
  });

  it('allows enabling notifyOnResolve', () => {
    const config = buildAlertConfig({ notifyOnResolve: true });
    expect(config.notifyOnResolve).toBe(true);
  });
});

describe('validateAlertConfig', () => {
  function makeConfig(overrides: Partial<AlertConfig> = {}): AlertConfig {
    return {
      enabled: true,
      thresholds: { maxLatencyMs: 1000, maxErrorRate: 0.05, minRequestCount: 10 },
      notifyOnResolve: false,
      cooldownMs: 60000,
      ...overrides,
    };
  }

  it('returns no errors for a valid config', () => {
    const errors = validateAlertConfig(makeConfig());
    expect(errors).toHaveLength(0);
  });

  it('returns error for non-positive maxLatencyMs', () => {
    const config = makeConfig({ thresholds: { maxLatencyMs: -1 } });
    const errors = validateAlertConfig(config);
    expect(errors).toContain('maxLatencyMs must be greater than 0');
  });

  it('returns error for maxErrorRate out of range', () => {
    const config = makeConfig({ thresholds: { maxErrorRate: 1.5 } });
    const errors = validateAlertConfig(config);
    expect(errors).toContain('maxErrorRate must be between 0 and 1');
  });

  it('returns error for negative minRequestCount', () => {
    const config = makeConfig({ thresholds: { minRequestCount: -5 } });
    const errors = validateAlertConfig(config);
    expect(errors).toContain('minRequestCount must be non-negative');
  });

  it('returns error for negative cooldownMs', () => {
    const config = makeConfig({ cooldownMs: -100 });
    const errors = validateAlertConfig(config);
    expect(errors).toContain('cooldownMs must be non-negative');
  });

  it('can return multiple errors at once', () => {
    const config = makeConfig({
      thresholds: { maxLatencyMs: 0, maxErrorRate: 2 },
      cooldownMs: -1,
    });
    const errors = validateAlertConfig(config);
    expect(errors.length).toBeGreaterThanOrEqual(3);
  });
});
