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

  if (config.maxConcurrent < 1) {
    errors.push('maxConcurrent must be at least 1');
  }
  if (config.queueTimeout < 0) {
    errors.push('queueTimeout must be non-negative');
  }

  return errors;
}
