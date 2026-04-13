import { buildSamplingConfig, validateSamplingConfig } from './samplingConfig';

describe('buildSamplingConfig', () => {
  it('returns defaults when no args provided', () => {
    const config = buildSamplingConfig();
    expect(config.rate).toBe(1.0);
    expect(config.alwaysCapture).toEqual([]);
    expect(config.neverCapture).toEqual([]);
  });

  it('merges partial config with defaults', () => {
    const config = buildSamplingConfig({ rate: 0.5, alwaysCapture: ['/health'] });
    expect(config.rate).toBe(0.5);
    expect(config.alwaysCapture).toEqual(['/health']);
    expect(config.neverCapture).toEqual([]);
  });

  it('throws if rate is below 0', () => {
    expect(() => buildSamplingConfig({ rate: -0.1 })).toThrow();
  });

  it('throws if rate is above 1', () => {
    expect(() => buildSamplingConfig({ rate: 1.5 })).toThrow();
  });

  it('accepts boundary values 0 and 1', () => {
    expect(() => buildSamplingConfig({ rate: 0 })).not.toThrow();
    expect(() => buildSamplingConfig({ rate: 1 })).not.toThrow();
  });
});

describe('validateSamplingConfig', () => {
  it('returns no errors for a valid config', () => {
    const errors = validateSamplingConfig({ rate: 0.5, alwaysCapture: [], neverCapture: [] });
    expect(errors).toHaveLength(0);
  });

  it('returns error when rate is out of range', () => {
    const errors = validateSamplingConfig({ rate: 2 });
    expect(errors.some((e) => e.includes('rate'))).toBe(true);
  });

  it('returns error when alwaysCapture is not an array', () => {
    const errors = validateSamplingConfig({ rate: 1, alwaysCapture: 'bad' as any });
    expect(errors.some((e) => e.includes('alwaysCapture'))).toBe(true);
  });
});
