import { buildRetentionPolicy, validateRetentionPolicy } from "./retentionPolicy";

describe("buildRetentionPolicy", () => {
  it("returns defaults when no overrides provided", () => {
    const config = buildRetentionPolicy();
    expect(config.maxAgeMs).toBe(60 * 60 * 1000);
    expect(config.maxEntries).toBe(10_000);
    expect(config.pruneIntervalMs).toBe(5 * 60 * 1000);
  });

  it("merges partial overrides", () => {
    const config = buildRetentionPolicy({ maxAgeMs: 30_000, maxEntries: 500 });
    expect(config.maxAgeMs).toBe(30_000);
    expect(config.maxEntries).toBe(500);
    expect(config.pruneIntervalMs).toBe(5 * 60 * 1000);
  });
});

describe("validateRetentionPolicy", () => {
  it("returns no errors for valid config", () => {
    const config = buildRetentionPolicy();
    expect(validateRetentionPolicy(config)).toHaveLength(0);
  });

  it("errors on non-positive maxAgeMs", () => {
    const config = buildRetentionPolicy({ maxAgeMs: 0 });
    const errors = validateRetentionPolicy(config);
    expect(errors).toContain("maxAgeMs must be greater than 0");
  });

  it("errors on non-positive maxEntries", () => {
    const config = buildRetentionPolicy({ maxEntries: -1 });
    const errors = validateRetentionPolicy(config);
    expect(errors).toContain("maxEntries must be greater than 0");
  });

  it("errors on non-positive pruneIntervalMs", () => {
    const config = buildRetentionPolicy({ pruneIntervalMs: 0 });
    const errors = validateRetentionPolicy(config);
    expect(errors).toContain("pruneIntervalMs must be greater than 0");
  });

  it("errors when pruneIntervalMs exceeds maxAgeMs", () => {
    const config = buildRetentionPolicy({
      maxAgeMs: 1000,
      pruneIntervalMs: 5000,
    });
    const errors = validateRetentionPolicy(config);
    expect(errors).toContain("pruneIntervalMs should not exceed maxAgeMs");
  });
});
