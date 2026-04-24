import { AbTestVariant } from "./routeAbTestTracker";

export interface AbTestExperiment {
  route: string;
  method: string;
  variants: AbTestVariant[];
}

export interface AbTestConfig {
  experiments: AbTestExperiment[];
}

export function buildAbTestConfig(input: Partial<AbTestConfig>): AbTestConfig {
  return {
    experiments: input.experiments ?? [],
  };
}

export function validateAbTestConfig(config: AbTestConfig): string[] {
  const errors: string[] = [];
  for (const exp of config.experiments) {
    if (!exp.route || typeof exp.route !== "string") {
      errors.push("Each experiment must have a valid route string.");
    }
    if (!exp.method || typeof exp.method !== "string") {
      errors.push("Each experiment must have a valid method string.");
    }
    if (!Array.isArray(exp.variants) || exp.variants.length < 2) {
      errors.push(`Experiment for ${exp.method}:${exp.route} must define at least 2 variants.`);
    }
    const totalWeight = exp.variants.reduce((sum, v) => sum + (v.weight ?? 0), 0);
    if (Math.abs(totalWeight - 1) > 0.001) {
      errors.push(`Variants for ${exp.method}:${exp.route} weights must sum to 1 (got ${totalWeight}).`);
    }
    const names = exp.variants.map((v) => v.name);
    if (new Set(names).size !== names.length) {
      errors.push(`Variant names for ${exp.method}:${exp.route} must be unique.`);
    }
  }
  return errors;
}
