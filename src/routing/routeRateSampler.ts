/**
 * routeRateSampler — computes per-route request rates (req/s) over a
 * sliding time window using the route request counter.
 */

import { createRouteRequestCounter } from './routeRequestCounter';

export interface RouteSampleEntry {
  route: string;
  method: string;
  requestsPerSecond: number;
  totalRequests: number;
  windowMs: number;
}

export interface RouteRateSamplerOptions {
  windowMs?: number; // default 60_000 (1 min)
}

export interface RouteRateSampler {
  record(route: string, method: string): void;
  getSample(route: string, method: string): RouteSampleEntry | null;
  getAllSamples(): RouteSampleEntry[];
  reset(): void;
}

type Bucket = { ts: number };

function makeKey(route: string, method: string): string {
  return `${method.toUpperCase()}::${route}`;
}

export function createRouteRateSampler(
  options: RouteRateSamplerOptions = {}
): RouteRateSampler {
  const windowMs = options.windowMs ?? 60_000;
  const buckets = new Map<string, Bucket[]>();
  const meta = new Map<string, { route: string; method: string }>();

  function prune(key: string): void {
    const now = Date.now();
    const list = buckets.get(key) ?? [];
    const pruned = list.filter((b) => now - b.ts <= windowMs);
    buckets.set(key, pruned);
  }

  function record(route: string, method: string): void {
    const key = makeKey(route, method);
    if (!meta.has(key)) meta.set(key, { route, method });
    prune(key);
    const list = buckets.get(key) ?? [];
    list.push({ ts: Date.now() });
    buckets.set(key, list);
  }

  function toEntry(key: string): RouteSampleEntry {
    prune(key);
    const list = buckets.get(key) ?? [];
    const { route, method } = meta.get(key)!;
    const rps = list.length / (windowMs / 1000);
    return {
      route,
      method,
      requestsPerSecond: Math.round(rps * 100) / 100,
      totalRequests: list.length,
      windowMs,
    };
  }

  function getSample(route: string, method: string): RouteSampleEntry | null {
    const key = makeKey(route, method);
    if (!meta.has(key)) return null;
    return toEntry(key);
  }

  function getAllSamples(): RouteSampleEntry[] {
    return Array.from(meta.keys()).map(toEntry);
  }

  function reset(): void {
    buckets.clear();
    meta.clear();
  }

  return { record, getSample, getAllSamples, reset };
}
