import { createRoutePayloadTracker } from "./routePayloadTracker";

describe("createRoutePayloadTracker", () => {
  it("records request and response payload sizes", () => {
    const tracker = createRoutePayloadTracker();
    tracker.record("/api/users", "GET", 128, 512);
    const all = tracker.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].route).toBe("/api/users");
    expect(all[0].method).toBe("GET");
    expect(all[0].requestSizeBytes.total).toBe(128);
    expect(all[0].responseSizeBytes.total).toBe(512);
  });

  it("accumulates multiple records for the same route/method", () => {
    const tracker = createRoutePayloadTracker();
    tracker.record("/api/items", "POST", 200, 400);
    tracker.record("/api/items", "POST", 300, 600);
    const all = tracker.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].requestSizeBytes.total).toBe(500);
    expect(all[0].requestSizeBytes.count).toBe(2);
    expect(all[0].requestSizeBytes.avg).toBe(250);
    expect(all[0].requestSizeBytes.max).toBe(300);
    expect(all[0].responseSizeBytes.avg).toBe(500);
  });

  it("tracks max payload correctly", () => {
    const tracker = createRoutePayloadTracker();
    tracker.record("/api/data", "PUT", 50, 100);
    tracker.record("/api/data", "PUT", 900, 200);
    tracker.record("/api/data", "PUT", 300, 50);
    const stats = tracker.getAll()[0];
    expect(stats.requestSizeBytes.max).toBe(900);
    expect(stats.responseSizeBytes.max).toBe(200);
  });

  it("separates entries by method", () => {
    const tracker = createRoutePayloadTracker();
    tracker.record("/api/users", "GET", 0, 256);
    tracker.record("/api/users", "POST", 512, 128);
    const all = tracker.getAll();
    expect(all).toHaveLength(2);
    const methods = all.map((s) => s.method).sort();
    expect(methods).toEqual(["GET", "POST"]);
  });

  it("getByRoute filters by route", () => {
    const tracker = createRoutePayloadTracker();
    tracker.record("/api/users", "GET", 100, 200);
    tracker.record("/api/orders", "GET", 50, 150);
    const results = tracker.getByRoute("/api/users");
    expect(results).toHaveLength(1);
    expect(results[0].route).toBe("/api/users");
  });

  it("returns empty array for unknown route", () => {
    const tracker = createRoutePayloadTracker();
    expect(tracker.getByRoute("/unknown")).toEqual([]);
  });

  it("reset clears all data", () => {
    const tracker = createRoutePayloadTracker();
    tracker.record("/api/users", "GET", 100, 200);
    tracker.reset();
    expect(tracker.getAll()).toHaveLength(0);
  });

  it("avg is 0 when count is 0 (edge case via reset)", () => {
    const tracker = createRoutePayloadTracker();
    tracker.reset();
    expect(tracker.getAll()).toEqual([]);
  });
});
