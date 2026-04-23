export interface ThrottleConfig {
  maxConcurrent: number;
  queueTimeout: number; // ms
  perRoute: boolean;
}

const DEFAULTS: ThrottleConfig = {
  maxConcurrent: 10,
  queueTimeout: 5000,
  perRoute: false,
};

export function buildThrottleConfig(partial: Partial<ThrottleConfig> = {}): ThrottleConfig {
  return { ...DEFAULTS, ...partial };
}

export function validateThrottleConfig(config: ThrottleConfig): string[] {
  const errors: string[] = [];

  if (!Number.isInteger(config.maxConcurrent) || config.maxConcurrent < 1) {
    errors.push('maxConcurrent must be a positive integer');
  }
  if (!Number.isFinite(config.queueTimeout) || config.queueTimeout < 0) {
    errors.push('queueTimeout must be a non-negative finite number');
  }

  return errors;
}

/**
 * Builds and validates a ThrottleConfig in one step.
 * Throws an error if the resulting config is invalid.
 */
export function buildValidatedThrottleConfig(partial: Partial<ThrottleConfig> = {}): ThrottleConfig {
  const config = buildThrottleConfig(partial);
  const errors = validateThrottleConfig(config);
  if (errors.length > 0) {
    throw new Error(`Invalid ThrottleConfig: ${errors.join('; ')}`);
  }
  return config;
}
