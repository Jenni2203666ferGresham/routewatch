export interface HeatmapEntry {
  route: string;
  method: string;
  hits: number[];
  bucketSizeMs: number;
  createdAt: number;
}

export interface RouteHeatmap {
  record(route: string, method: string, timestampMs?: number): void;
  getEntry(route: string, method: string): HeatmapEntry | undefined;
  getAll(): HeatmapEntry[];
  getHotRoutes(threshold: number): HeatmapEntry[];
  reset(): void;
}

const DEFAULT_BUCKET_SIZE_MS = 60_000; // 1 minute
const DEFAULT_BUCKET_COUNT = 60;      // 60 buckets = 1 hour window

function makeKey(route: string, method: string): string {
  return `${method.toUpperCase()}:${route}`;
}

export function createRouteHeatmap(
  bucketSizeMs = DEFAULT_BUCKET_SIZE_MS,
  bucketCount = DEFAULT_BUCKET_COUNT
): RouteHeatmap {
  const entries = new Map<string, HeatmapEntry>();

  function getOrCreate(route: string, method: string): HeatmapEntry {
    const key = makeKey(route, method);
    if (!entries.has(key)) {
      entries.set(key, {
        route,
        method: method.toUpperCase(),
        hits: new Array(bucketCount).fill(0),
        bucketSizeMs,
        createdAt: Date.now(),
      });
    }
    return entries.get(key)!;
  }

  function bucketIndex(entry: HeatmapEntry, timestampMs: number): number {
    const elapsed = timestampMs - entry.createdAt;
    const idx = Math.floor(elapsed / bucketSizeMs);
    return idx % bucketCount;
  }

  return {
    record(route, method, timestampMs = Date.now()) {
      const entry = getOrCreate(route, method);
      const idx = bucketIndex(entry, timestampMs);
      if (idx >= 0 && idx < bucketCount) {
        entry.hits[idx]++;
      }
    },

    getEntry(route, method) {
      return entries.get(makeKey(route, method));
    },

    getAll() {
      return Array.from(entries.values());
    },

    getHotRoutes(threshold) {
      return Array.from(entries.values()).filter(
        (e) => e.hits.reduce((a, b) => a + b, 0) >= threshold
      );
    },

    reset() {
      entries.clear();
    },
  };
}
