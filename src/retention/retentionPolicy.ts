export interface RetentionPolicyConfig {
  maxAgeMs: number;
  maxEntries: number;
  pruneIntervalMs: number;
}

const DEFAULTS: RetentionPolicyConfig = {
  maxAgeMs: 60 * 60 * 1000, // 1 hour
  maxEntries: 10_000,
  pruneIntervalMs: 5 * 60 * 1000, // 5 minutes
};

export function buildRetentionPolicy(
  partial: Partial<RetentionPolicyConfig> = {}
): RetentionPolicyConfig {
  return { ...DEFAULTS, ...partial };
}

export function validateRetentionPolicy(
  config: RetentionPolicyConfig
): string[] {
  const errors: string[] = [];
  if (config.maxAgeMs <= 0) {
    errors.push("maxAgeMs must be greater than 0");
  }
  if (config.maxEntries <= 0) {
    errors.push("maxEntries must be greater than 0");
  }
  if (config.pruneIntervalMs <= 0) {
    errors.push("pruneIntervalMs must be greater than 0");
  }
  if (config.pruneIntervalMs > config.maxAgeMs) {
    errors.push("pruneIntervalMs should not exceed maxAgeMs");
  }
  return errors;
}
