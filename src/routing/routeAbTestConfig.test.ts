import { buildAbTestConfig, validateAbTestConfig } from "./routeAbTestConfig";

describe("buildAbTestConfig", () => {
  it("returns defaults for empty input", () => {
    const config = buildAbTestConfig({});
    expect(config.experiments).toEqual([]);
  });

  it("preserves provided experiments", () => {
    const experiments = [
      {
        route: "/api/test",
        method: "GET",
        variants: [
          { name: "control", weight: 0.5 },
          { name: "treatment", weight: 0.5 },
        ],
      },
    ];
    const config = buildAbTestConfig({ experiments });
    expect(config.experiments).toHaveLength(1);
    expect(config.experiments[0].route).toBe("/api/test");
  });
});

describe("validateAbTestConfig", () => {
  it("returns no errors for a valid config", () => {
    const config = buildAbTestConfig({
      experiments: [
        {
          route: "/api/items",
          method: "GET",
          variants: [
            { name: "a", weight: 0.5 },
            { name: "b", weight: 0.5 },
          ],
        },
      ],
    });
    expect(validateAbTestConfig(config)).toHaveLength(0);
  });

  it("errors when fewer than 2 variants", () => {
    const config = buildAbTestConfig({
      experiments: [
        { route: "/x", method: "GET", variants: [{ name: "only", weight: 1 }] },
      ],
    });
    const errors = validateAbTestConfig(config);
    expect(errors.some((e) => e.includes("at least 2 variants"))).toBe(true);
  });

  it("errors when weights do not sum to 1", () => {
    const config = buildAbTestConfig({
      experiments: [
        {
          route: "/x",
          method: "GET",
          variants: [
            { name: "a", weight: 0.3 },
            { name: "b", weight: 0.3 },
          ],
        },
      ],
    });
    const errors = validateAbTestConfig(config);
    expect(errors.some((e) => e.includes("weights must sum to 1"))).toBe(true);
  });

  it("errors on duplicate variant names", () => {
    const config = buildAbTestConfig({
      experiments: [
        {
          route: "/x",
          method: "GET",
          variants: [
            { name: "a", weight: 0.5 },
            { name: "a", weight: 0.5 },
          ],
        },
      ],
    });
    const errors = validateAbTestConfig(config);
    expect(errors.some((e) => e.includes("unique"))).toBe(true);
  });
});
