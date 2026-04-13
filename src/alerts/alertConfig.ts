export interface AlertThreshold {
  maxLatencyMs?: number;
  maxErrorRate?: number;
  minRequestCount?: number;
}

export interface AlertConfig {
  enabled: boolean;
  thresholds: AlertThreshold;
  notifyOnResolve: boolean;
  cooldownMs: number;
}

export interface AlertConfigInput {
  enabled?: boolean;
  maxLatencyMs?: number;
  maxErrorRate?: number;
  minRequestCount?: number;
  notifyOnResolve?: boolean;
  cooldownMs?: number;
}

const DEFAULT_CONFIG: AlertConfig = {
  enabled: true,
  thresholds: {
    maxLatencyMs: 1000,
    maxErrorRate: 0.05,
    minRequestCount: 10,
  },
  notifyOnResolve: false,
  cooldownMs: 60000,
};

export function buildAlertConfig(input: AlertConfigInput = {}): AlertConfig {
  return {
    enabled: input.enabled ?? DEFAULT_CONFIG.enabled,
    thresholds: {
      maxLatencyMs: input.maxLatencyMs ?? DEFAULT_CONFIG.thresholds.maxLatencyMs,
      maxErrorRate: input.maxErrorRate ?? DEFAULT_CONFIG.thresholds.maxErrorRate,
      minRequestCount: input.minRequestCount ?? DEFAULT_CONFIG.thresholds.minRequestCount,
    },
    notifyOnResolve: input.notifyOnResolve ?? DEFAULT_CONFIG.notifyOnResolve,
    cooldownMs: input.cooldownMs ?? DEFAULT_CONFIG.cooldownMs,
  };
}

export function validateAlertConfig(config: AlertConfig): string[] {
  const errors: string[] = [];

  if (config.thresholds.maxLatencyMs !== undefined && config.thresholds.maxLatencyMs <= 0) {
    errors.push('maxLatencyMs must be greater than 0');
  }
  if (config.thresholds.maxErrorRate !== undefined) {
    if (config.thresholds.maxErrorRate < 0 || config.thresholds.maxErrorRate > 1) {
      errors.push('maxErrorRate must be between 0 and 1');
    }
  }
  if (config.thresholds.minRequestCount !== undefined && config.thresholds.minRequestCount < 0) {
    errors.push('minRequestCount must be non-negative');
  }
  if (config.cooldownMs < 0) {
    errors.push('cooldownMs must be non-negative');
  }

  return errors;
}
