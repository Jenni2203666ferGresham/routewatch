import { MetricsStore } from "../metrics/MetricsStore";
import { RetentionPolicyConfig } from "./retentionPolicy";

export interface PruneResult {
  routesPruned: number;
  entriesRemoved: number;
  timestamp: number;
}

export function pruneByAge(
  store: MetricsStore,
  maxAgeMs: number,
  now: number = Date.now()
): PruneResult {
  const cutoff = now - maxAgeMs;
  let routesPruned = 0;
  let entriesRemoved = 0;

  for (const [route, metrics] of store.entries()) {
    const before = metrics.latencies.length;
    const fresh = metrics.latencies.filter((m) => m.timestamp >= cutoff);
    const removed = before - fresh.length;
    if (removed > 0) {
      metrics.latencies = fresh;
      entriesRemoved += removed;
    }
    if (metrics.latencies.length === 0 && metrics.requestCount === 0) {
      store.delete(route);
      routesPruned++;
    }
  }

  return { routesPruned, entriesRemoved, timestamp: now };
}

export function pruneByCount(
  store: MetricsStore,
  maxEntries: number
): PruneResult {
  let entriesRemoved = 0;
  let routesPruned = 0;

  for (const [route, metrics] of store.entries()) {
    if (metrics.latencies.length > maxEntries) {
      const overflow = metrics.latencies.length - maxEntries;
      metrics.latencies = metrics.latencies.slice(overflow);
      entriesRemoved += overflow;
    }
    if (metrics.latencies.length === 0 && metrics.requestCount === 0) {
      store.delete(route);
      routesPruned++;
    }
  }

  return { routesPruned, entriesRemoved, timestamp: Date.now() };
}

export function createRetentionManager(config: RetentionPolicyConfig) {
  let timer: ReturnType<typeof setInterval> | null = null;
  const history: PruneResult[] = [];

  function prune(store: MetricsStore): PruneResult {
    const byAge = pruneByAge(store, config.maxAgeMs);
    const byCount = pruneByCount(store, config.maxEntries);
    const result: PruneResult = {
      routesPruned: byAge.routesPruned + byCount.routesPruned,
      entriesRemoved: byAge.entriesRemoved + byCount.entriesRemoved,
      timestamp: Date.now(),
    };
    history.push(result);
    return result;
  }

  function start(store: MetricsStore): void {
    if (timer) return;
    timer = setInterval(() => prune(store), config.pruneIntervalMs);
  }

  function stop(): void {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function getHistory(): PruneResult[] {
    return [...history];
  }

  return { prune, start, stop, getHistory };
}
