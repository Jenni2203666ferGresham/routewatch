export interface SamplingConfig {
  /** Rate between 0 and 1. 1 = capture all, 0.1 = capture 10% */
  rate: number;
  /** Routes to always capture regardless of rate */
  alwaysCapture?: string[];
  /** Routes to never capture */
  neverCapture?: string[];
}

const DEFAULT_CONFIG: SamplingConfig = {
  rate: 1.0,
  alwaysCapture: [],
  neverCapture: [],
};

export function buildSamplingConfig(
  partial: Partial<SamplingConfig> = {}
): SamplingConfig {
  const config = { ...DEFAULT_CONFIG, ...partial };
  if (config.rate < 0 || config.rate > 1) {
    throw new Error(`Sampling rate must be between 0 and 1, got ${config.rate}`);
  }
  return config;
}

export function validateSamplingConfig(config: SamplingConfig): string[] {
  const errors: string[] = [];
  if (typeof config.rate !== 'number' || config.rate < 0 || config.rate > 1) {
    errors.push('rate must be a number between 0 and 1');
  }
  if (config.alwaysCapture && !Array.isArray(config.alwaysCapture)) {
    errors.push('alwaysCapture must be an array of strings');
  }
  if (config.neverCapture && !Array.isArray(config.neverCapture)) {
    errors.push('neverCapture must be an array of strings');
  }
  return errors;
}
