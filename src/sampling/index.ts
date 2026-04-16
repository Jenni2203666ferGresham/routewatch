/**
 * Sampling module for routewatch.
 * Provides configuration building, validation, and sampler creation
 * for controlling the rate at which routes are monitored.
 */
export { buildSamplingConfig, validateSamplingConfig } from './samplingConfig';
export type { SamplingConfig } from './samplingConfig';
export { createSampler } from './sampler';
export type { Sampler } from './sampler';
