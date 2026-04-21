import { createRouteLatencyMap } from "./routeLatencyMap";

describe("createRouteLatencyMap", () => {
  it("records a sample and retrieves the entry", () => {
    const map = createRouteLatencyMap();
    map.record("GET", "/users", 42);
    const entry = map.getEntry("GET", "/users");
    expect(entry).toBeDefined();
    expect(entry!.samples).toEqual([42]);
    expect(entry!.method).toBe("GET");
    expect(entry!.route).toBe("/users");
  });

  it("normalises method to uppercase", () => {
    const map = createRouteLatencyMap();
    map.record("get", "/ping", 10);
    expect(map.getEntry("get", "/ping")).toBeDefined();
    expect(map.getEntry("GET", "/ping")).toBeDefined();
  });

  it("computes average correctly", () => {
    const map = createRouteLatencyMap();
    map.record("POST", "/orders", 100);
    map.record("POST", "/orders", 200);
    map.record("POST", "/orders", 300);
    expect(map.getAverage("POST", "/orders")).toBe(200);
  });

  it("returns null average for unknown route", () => {
    const map = createRouteLatencyMap();
    expect(map.getAverage("GET", "/nope")).toBeNull();
  });

  it("computes p95 over a sample set", () => {
    const map = createRouteLatencyMap();
    for (let i = 1; i <= 20; i++) {
      map.record("GET", "/items", i * 10);
    }
    const p95 = map.getP95("GET", "/items");
    expect(p95).toBeGreaterThanOrEqual(180);
    expect(p95).toBeLessThanOrEqual(200);
  });

  it("returns null p95 for unknown route", () => {
    const map = createRouteLatencyMap();
    expect(map.getP95("DELETE", "/nothing")).toBeNull();
  });

  it("respects the rolling window size", () => {
    const map = createRouteLatencyMap(3);
    map.record("GET", "/r", 1);
    map.record("GET", "/r", 2);
    map.record("GET", "/r", 3);
    map.record("GET", "/r", 4);
    const entry = map.getEntry("GET", "/r");
    expect(entry!.samples).toEqual([2, 3, 4]);
    expect(entry!.samples.length).toBe(3);
  });

  it("getAll returns all tracked entries", () => {
    const map = createRouteLatencyMap();
    map.record("GET", "/a", 10);
    map.record("POST", "/b", 20);
    expect(map.getAll().length).toBe(2);
  });

  it("reset clears all entries", () => {
    const map = createRouteLatencyMap();
    map.record("GET", "/x", 99);
    map.reset();
    expect(map.getAll()).toEqual([]);
    expect(map.getEntry("GET", "/x")).toBeUndefined();
  });

  it("tracks separate entries per method", () => {
    const map = createRouteLatencyMap();
    map.record("GET", "/resource", 50);
    map.record("POST", "/resource", 150);
    expect(map.getAverage("GET", "/resource")).toBe(50);
    expect(map.getAverage("POST", "/resource")).toBe(150);
  });
});
