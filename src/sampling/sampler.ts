import { SamplingConfig } from './samplingConfig';

export interface Sampler {
  shouldSample(route: string): boolean;
}

/**
 * Creates a sampler that decides whether a given route call should be recorded.
 * Uses a deterministic-ish random check per call.
 */
export function createSampler(config: SamplingConfig): Sampler {
  const alwaysSet = new Set(config.alwaysCapture ?? []);
  const neverSet = new Set(config.neverCapture ?? []);

  return {
    shouldSample(route: string): boolean {
      if (neverSet.has(route)) {
        return false;
      }
      if (alwaysSet.has(route)) {
        return true;
      }
      if (config.rate >= 1) {
        return true;
      }
      if (config.rate <= 0) {
        return false;
      }
      return Math.random() < config.rate;
    },
  };
}
