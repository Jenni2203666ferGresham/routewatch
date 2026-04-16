import { buildDedupeConfig, validateDedupeConfig } from './dedupeConfig';

describe('buildDedupeConfig', () => {
  it('returns defaults when no input given', () => {
    const cfg = buildDedupeConfig();
    expect(cfg.windowMs).toBe(2000);
    expect(cfg.maxTracked).toBe(1000);
  });

  it('applies provided values', () => {
    const cfg = buildDedupeConfig({ windowMs: 500, maxTracked: 50 });
    expect(cfg.windowMs).toBe(500);
    expect(cfg.maxTracked).toBe(50);
  });

  it('applies partial overrides', () => {
    const cfg = buildDedupeConfig({ windowMs: 100 });
    expect(cfg.windowMs).toBe(100);
    expect(cfg.maxTracked).toBe(1000);
  });
});

describe('validateDedupeConfig', () => {
  it('returns no errors for valid config', () => {
    const cfg = buildDedupeConfig();
    expect(validateDedupeConfig(cfg)).toHaveLength(0);
  });

  it('errors on non-positive windowMs', () => {
    const errs = validateDedupeConfig({ windowMs: 0, maxTracked: 100 });
    expect(errs).toContain('windowMs must be positive');
  });

  it('errors on non-positive maxTracked', () => {
    const errs = validateDedupeConfig({ windowMs: 1000, maxTracked: -1 });
    expect(errs).toContain('maxTracked must be positive');
  });

  it('returns multiple errors', () => {
    const errs = validateDedupeConfig({ windowMs: -1, maxTracked: 0 });
    expect(errs).toHaveLength(2);
  });
});
