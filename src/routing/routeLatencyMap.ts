/**
 * routeLatencyMap.ts
 * Maintains a per-route rolling latency window for quick lookups.
 */

export interface LatencyEntry {
  route: string;
  method: string;
  samples: number[];
  windowSize: number;
}

export interface RouteLatencyMap {
  record: (method: string, route: string, latencyMs: number) => void;
  getEntry: (method: string, route: string) => LatencyEntry | undefined;
  getAll: () => LatencyEntry[];
  getAverage: (method: string, route: string) => number | null;
  getP95: (method: string, route: string) => number | null;
  reset: () => void;
}

function makeKey(method: string, route: string): string {
  return `${method.toUpperCase()}::${route}`;
}

function computePercentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

export function createRouteLatencyMap(windowSize = 100): RouteLatencyMap {
  const entries = new Map<string, LatencyEntry>();

  function ensure(method: string, route: string): LatencyEntry {
    const key = makeKey(method, route);
    if (!entries.has(key)) {
      entries.set(key, { route, method: method.toUpperCase(), samples: [], windowSize });
    }
    return entries.get(key)!;
  }

  return {
    record(method, route, latencyMs) {
      const entry = ensure(method, route);
      entry.samples.push(latencyMs);
      if (entry.samples.length > windowSize) {
        entry.samples.shift();
      }
    },

    getEntry(method, route) {
      return entries.get(makeKey(method, route));
    },

    getAll() {
      return Array.from(entries.values());
    },

    getAverage(method, route) {
      const entry = entries.get(makeKey(method, route));
      if (!entry || entry.samples.length === 0) return null;
      const sum = entry.samples.reduce((a, b) => a + b, 0);
      return sum / entry.samples.length;
    },

    getP95(method, route) {
      const entry = entries.get(makeKey(method, route));
      if (!entry || entry.samples.length === 0) return null;
      const sorted = [...entry.samples].sort((a, b) => a - b);
      return computePercentile(sorted, 95);
    },

    reset() {
      entries.clear();
    },
  };
}
