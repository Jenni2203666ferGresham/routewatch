import {
  computeLatencyScore,
  computeErrorScore,
  computeThroughputScore,
  computeSlaScore,
  gradeFromScore,
  scoreRouteQuality,
  rankByQuality,
  RouteQualityInput,
} from './routeQualityScore';

function makeInput(overrides: Partial<RouteQualityInput> = {}): RouteQualityInput {
  return {
    route: '/api/users',
    method: 'GET',
    avgLatencyMs: 50,
    p99LatencyMs: 120,
    errorRate: 0.01,
    requestsPerMinute: 80,
    slaBreachRate: 0.01,
    latencyBudgetMs: 200,
    ...overrides,
  };
}

describe('computeLatencyScore', () => {
  it('returns 100 when well within budget', () => {
    expect(computeLatencyScore(50, 200)).toBe(100);
  });

  it('returns 50 when at budget', () => {
    expect(computeLatencyScore(200, 200)).toBe(50);
  });

  it('returns 0 or near 0 when far over budget', () => {
    expect(computeLatencyScore(600, 200)).toBe(0);
  });

  it('handles zero budget gracefully', () => {
    expect(computeLatencyScore(100, 0)).toBe(50);
  });
});

describe('computeErrorScore', () => {
  it('returns 100 for negligible error rate', () => {
    expect(computeErrorScore(0)).toBe(100);
  });

  it('returns 0 for high error rate', () => {
    expect(computeErrorScore(0.2)).toBe(0);
  });

  it('returns proportional score for mid range', () => {
    const score = computeErrorScore(0.1);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(100);
  });
});

describe('computeThroughputScore', () => {
  it('returns 50 for zero rpm', () => {
    expect(computeThroughputScore(0)).toBe(50);
  });

  it('returns 100 for high rpm', () => {
    expect(computeThroughputScore(200)).toBe(100);
  });

  it('scales linearly below 100 rpm', () => {
    expect(computeThroughputScore(50)).toBe(50);
  });
});

describe('computeSlaScore', () => {
  it('returns 100 for zero breaches', () => {
    expect(computeSlaScore(0)).toBe(100);
  });

  it('returns 0 at 10% breach rate', () => {
    expect(computeSlaScore(0.1)).toBe(0);
  });
});

describe('gradeFromScore', () => {
  it.each([
    [95, 'A'],
    [80, 'B'],
    [65, 'C'],
    [45, 'D'],
    [20, 'F'],
  ] as const)('score %d => grade %s', (score, grade) => {
    expect(gradeFromScore(score)).toBe(grade);
  });
});

describe('scoreRouteQuality', () => {
  it('returns a result with all fields', () => {
    const result = scoreRouteQuality(makeInput());
    expect(result.route).toBe('/api/users');
    expect(result.method).toBe('GET');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(['A', 'B', 'C', 'D', 'F']).toContain(result.grade);
    expect(result.breakdown).toHaveProperty('latencyScore');
    expect(result.breakdown).toHaveProperty('errorScore');
  });

  it('gives a high score to a healthy route', () => {
    const result = scoreRouteQuality(makeInput({ avgLatencyMs: 20, errorRate: 0, slaBreachRate: 0, requestsPerMinute: 120 }));
    expect(result.score).toBeGreaterThanOrEqual(80);
  });

  it('gives a low score to a degraded route', () => {
    const result = scoreRouteQuality(makeInput({ avgLatencyMs: 800, errorRate: 0.15, slaBreachRate: 0.08 }));
    expect(result.score).toBeLessThan(50);
  });
});

describe('rankByQuality', () => {
  it('sorts routes by descending score', () => {
    const inputs = [
      makeInput({ route: '/slow', avgLatencyMs: 900, errorRate: 0.1 }),
      makeInput({ route: '/fast', avgLatencyMs: 10, errorRate: 0 }),
      makeInput({ route: '/mid',  avgLatencyMs: 150, errorRate: 0.03 }),
    ];
    const ranked = rankByQuality(inputs);
    expect(ranked[0].route).toBe('/fast');
    expect(ranked[ranked.length - 1].route).toBe('/slow');
  });

  it('returns empty array for empty input', () => {
    expect(rankByQuality([])).toEqual([]);
  });
});
