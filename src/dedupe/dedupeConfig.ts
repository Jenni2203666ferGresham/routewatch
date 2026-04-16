export interface DedupeConfig {
  windowMs: number;
  maxTracked: number;
}

export interface DedupeConfigInput {
  windowMs?: number;
  maxTracked?: number;
}

export function buildDedupeConfig(input: DedupeConfigInput = {}): DedupeConfig {
  return {
    windowMs: input.windowMs ?? 2000,
    maxTracked: input.maxTracked ?? 1000,
  };
}

export function validateDedupeConfig(config: DedupeConfig): string[] {
  const errors: string[] = [];
  if (config.windowMs <= 0) errors.push('windowMs must be positive');
  if (config.maxTracked <= 0) errors.push('maxTracked must be positive');
  return errors;
}
