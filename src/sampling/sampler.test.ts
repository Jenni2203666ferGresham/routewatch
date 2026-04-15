import { createSampler } from './sampler';
import { buildSamplingConfig } from './samplingConfig';

describe('createSampler', () => {
  it('always samples when rate is 1', () => {
    const sampler = createSampler(buildSamplingConfig({ rate: 1 }));
    for (let i = 0; i < 20; i++) {
      expect(sampler.shouldSample('/api/users')).toBe(true);
    }
  });

  it('never samples when rate is 0', () => {
    const sampler = createSampler(buildSamplingConfig({ rate: 0 }));
    for (let i = 0; i < 20; i++) {
      expect(sampler.shouldSample('/api/users')).toBe(false);
    }
  });

  it('always captures routes in alwaysCapture list regardless of rate', () => {
    const sampler = createSampler(
      buildSamplingConfig({ rate: 0, alwaysCapture: ['/health'] })
    );
    expect(sampler.shouldSample('/health')).toBe(true);
    expect(sampler.shouldSample('/api/data')).toBe(false);
  });

  it('never captures routes in neverCapture list regardless of rate', () => {
    const sampler = createSampler(
      buildSamplingConfig({ rate: 1, neverCapture: ['/internal'] })
    );
    expect(sampler.shouldSample('/internal')).toBe(false);
    expect(sampler.shouldSample('/api/data')).toBe(true);
  });

  it('neverCapture takes precedence over alwaysCapture', () => {
    const sampler = createSampler(
      buildSamplingConfig({
        rate: 1,
        alwaysCapture: ['/overlap'],
        neverCapture: ['/overlap'],
      })
    );
    expect(sampler.shouldSample('/overlap')).toBe(false);
  });

  it('samples approximately at the given rate', () => {
    const sampler = createSampler(buildSamplingConfig({ rate: 0.5 }));
    let captured = 0;
    const iterations = 10000;
    for (let i = 0; i < iterations; i++) {
      if (sampler.shouldSample('/api/test')) captured++;
    }
    const ratio = captured / iterations;
    expect(ratio).toBeGreaterThan(0.4);
    expect(ratio).toBeLessThan(0.6);
  });

  it('treats distinct routes independently for sampling decisions', () => {
    const sampler = createSampler(
      buildSamplingConfig({
        rate: 1,
        neverCapture: ['/internal'],
        alwaysCapture: ['/health'],
      })
    );
    expect(sampler.shouldSample('/health')).toBe(true);
    expect(sampler.shouldSample('/internal')).toBe(false);
    expect(sampler.shouldSample('/api/users')).toBe(true);
  });
});
