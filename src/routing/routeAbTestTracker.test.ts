import { createRouteAbTestTracker } from "./routeAbTestTracker";

describe("createRouteAbTestTracker", () => {
  it("registers an experiment and returns it", () => {
    const tracker = createRouteAbTestTracker();
    tracker.register("/api/items", "GET", [
      { name: "control", weight: 0.5 },
      { name: "treatment", weight: 0.5 },
    ]);
    const entry = tracker.getByRoute("/api/items", "GET");
    expect(entry).toBeDefined();
    expect(entry?.route).toBe("/api/items");
    expect(entry?.method).toBe("GET");
    expect(Object.keys(entry!.variants)).toEqual(["control", "treatment"]);
  });

  it("records hits and latency per variant", () => {
    const tracker = createRouteAbTestTracker();
    tracker.register("/api/items", "GET", [
      { name: "control", weight: 0.5 },
      { name: "treatment", weight: 0.5 },
    ]);
    tracker.record("/api/items", "GET", "control", 100, false);
    tracker.record("/api/items", "GET", "control", 200, false);
    tracker.record("/api/items", "GET", "treatment", 50, false);
    const entry = tracker.getByRoute("/api/items", "GET")!;
    expect(entry.variants["control"].hits).toBe(2);
    expect(entry.variants["control"].totalLatency).toBe(300);
    expect(entry.variants["treatment"].hits).toBe(1);
  });

  it("tracks errors per variant", () => {
    const tracker = createRouteAbTestTracker();
    tracker.register("/api/items", "POST", [
      { name: "a", weight: 0.5 },
      { name: "b", weight: 0.5 },
    ]);
    tracker.record("/api/items", "POST", "a", 80, true);
    tracker.record("/api/items", "POST", "a", 80, false);
    const entry = tracker.getByRoute("/api/items", "POST")!;
    expect(entry.variants["a"].errors).toBe(1);
  });

  it("returns winning variant by lowest latency+error score", () => {
    const tracker = createRouteAbTestTracker();
    tracker.register("/api/items", "GET", [
      { name: "slow", weight: 0.5 },
      { name: "fast", weight: 0.5 },
    ]);
    tracker.record("/api/items", "GET", "slow", 500, false);
    tracker.record("/api/items", "GET", "fast", 50, false);
    expect(tracker.getWinningVariant("/api/items", "GET")).toBe("fast");
  });

  it("returns undefined winning variant for unknown route", () => {
    const tracker = createRouteAbTestTracker();
    expect(tracker.getWinningVariant("/unknown", "GET")).toBeUndefined();
  });

  it("getAll returns all registered experiments", () => {
    const tracker = createRouteAbTestTracker();
    tracker.register("/a", "GET", [{ name: "x", weight: 0.5 }, { name: "y", weight: 0.5 }]);
    tracker.register("/b", "POST", [{ name: "x", weight: 0.5 }, { name: "y", weight: 0.5 }]);
    expect(tracker.getAll()).toHaveLength(2);
  });

  it("reset clears all entries", () => {
    const tracker = createRouteAbTestTracker();
    tracker.register("/a", "GET", [{ name: "x", weight: 1 }]);
    tracker.reset();
    expect(tracker.getAll()).toHaveLength(0);
  });
});
