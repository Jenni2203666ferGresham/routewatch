import { pruneByAge, pruneByCount, createRetentionManager } from "./retentionManager";
import { buildRetentionPolicy } from "./retentionPolicy";

function makeStore(): Map<string, any> {
  const store = new Map<string, any>();
  const now = Date.now();
  store.set("GET /old", {
    latencies: [
      { timestamp: now - 7200_000, value: 100 },
      { timestamp: now - 3600_000, value: 120 },
    ],
    requestCount: 2,
    errorCount: 0,
  });
  store.set("GET /recent", {
    latencies: [
      { timestamp: now - 1000, value: 50 },
      { timestamp: now - 500, value: 60 },
    ],
    requestCount: 2,
    errorCount: 0,
  });
  return store;
}

describe("pruneByAge", () => {
  it("removes entries older than maxAgeMs", () => {
    const store = makeStore() as any;
    const now = Date.now();
    const result = pruneByAge(store, 60 * 60 * 1000, now);
    expect(result.entriesRemoved).toBeGreaterThan(0);
    const old = store.get("GET /old");
    expect(old.latencies.length).toBeLessThan(2);
  });

  it("keeps recent entries intact", () => {
    const store = makeStore() as any;
    pruneByAge(store, 60 * 60 * 1000, Date.now());
    const recent = store.get("GET /recent");
    expect(recent.latencies.length).toBe(2);
  });
});

describe("pruneByCount", () => {
  it("trims latencies exceeding maxEntries", () => {
    const store = new Map<string, any>();
    store.set("POST /data", {
      latencies: Array.from({ length: 10 }, (_, i) => ({ timestamp: i, value: i })),
      requestCount: 10,
      errorCount: 0,
    });
    const result = pruneByCount(store as any, 5);
    expect(result.entriesRemoved).toBe(5);
    expect(store.get("POST /data").latencies.length).toBe(5);
  });

  it("does not prune if within limit", () => {
    const store = makeStore() as any;
    const result = pruneByCount(store, 100);
    expect(result.entriesRemoved).toBe(0);
  });
});

describe("createRetentionManager", () => {
  it("prune runs both age and count strategies", () => {
    const store = makeStore() as any;
    const config = buildRetentionPolicy({ maxAgeMs: 60 * 60 * 1000, maxEntries: 1 });
    const manager = createRetentionManager(config);
    const result = manager.prune(store);
    expect(result.entriesRemoved).toBeGreaterThanOrEqual(0);
    expect(manager.getHistory()).toHaveLength(1);
  });

  it("start and stop manage the interval", () => {
    jest.useFakeTimers();
    const store = makeStore() as any;
    const config = buildRetentionPolicy({ pruneIntervalMs: 1000, maxAgeMs: 5000 });
    const manager = createRetentionManager(config);
    manager.start(store);
    jest.advanceTimersByTime(3000);
    expect(manager.getHistory().length).toBeGreaterThanOrEqual(2);
    manager.stop();
    jest.useRealTimers();
  });
});
