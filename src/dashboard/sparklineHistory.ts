/**
 * Maintains a rolling window of latency samples per route
 * to power sparkline visualisations in the dashboard.
 */

export interface SparklineHistory {
  record(route: string, latencyMs: number): void;
  getHistory(route: string): number[];
  getAllHistory(): Map<string, number[]>;
  clear(): void;
}

/**
 * Creates a SparklineHistory instance that keeps the last
 * `windowSize` samples for each route.
 */
export function createSparklineHistory(windowSize = 20): SparklineHistory {
  const store = new Map<string, number[]>();

  return {
    record(route: string, latencyMs: number): void {
      if (!store.has(route)) {
        store.set(route, []);
      }
      const samples = store.get(route)!;
      samples.push(latencyMs);
      if (samples.length > windowSize) {
        samples.shift();
      }
    },

    getHistory(route: string): number[] {
      return store.get(route) ?? [];
    },

    getAllHistory(): Map<string, number[]> {
      return new Map(store);
    },

    clear(): void {
      store.clear();
    },
  };
}
