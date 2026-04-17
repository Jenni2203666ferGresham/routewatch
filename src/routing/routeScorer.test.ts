import { createRouteScorer, scoreRoute, ScorerInput } from './routeScorer';

const NOW = 1_700_000_000_000;

function makeInput(overrides: Partial<ScorerInput> = {}): ScorerInput {
  return {
    route: '/api/users',
    method: 'GET',
    callCount: 100,
    avgLatency: 200,
    errorRate: 0.05,
    lastSeenAt: NOW - 1000,
    ...overrides,
  };
}

describe('scoreRoute', () => {
  it('returns a score between 0 and 1', () => {
    const result = scoreRoute(makeInput(), {}, NOW);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(1);
  });

  it('includes all factor keys', () => {
    const result = scoreRoute(makeInput(), {}, NOW);
    expect(result.factors).toHaveProperty('callCount');
    expect(result.factors).toHaveProperty('avgLatency');
    expect(result.factors).toHaveProperty('errorRate');
    expect(result.factors).toHaveProperty('recency');
  });

  it('scores higher latency route higher on avgLatency factor', () => {
    const low = scoreRoute(makeInput({ avgLatency: 100 }), { avgLatency: 1, callCount: 0, errorRate: 0, recency: 0 }, NOW);
    const high = scoreRoute(makeInput({ avgLatency: 4000 }), { avgLatency: 1, callCount: 0, errorRate: 0, recency: 0 }, NOW);
    expect(high.score).toBeGreaterThan(low.score);
  });

  it('gives low recency to old routes', () => {
    const old = scoreRoute(makeInput({ lastSeenAt: NOW - 1000 * 60 * 60 * 2 }), {}, NOW);
    expect(old.factors.recency).toBe(0);
  });

  it('gives high recency to recent routes', () => {
    const recent = scoreRoute(makeInput({ lastSeenAt: NOW - 100 }), {}, NOW);
    expect(recent.factors.recency).toBeGreaterThan(0.9);
  });
});

describe('createRouteScorer', () => {
  it('scores a single input', () => {
    const scorer = createRouteScorer();
    const result = scorer.score(makeInput(), NOW);
    expect(result.route).toBe('/api/users');
    expect(typeof result.score).toBe('number');
  });

  it('scoreAll returns sorted descending', () => {
    const scorer = createRouteScorer({ callCount: 1, avgLatency: 0, errorRate: 0, recency: 0 });
    const inputs = [
      makeInput({ route: '/a', callCount: 10 }),
      makeInput({ route: '/b', callCount: 900 }),
      makeInput({ route: '/c', callCount: 500 }),
    ];
    const results = scorer.scoreAll(inputs, NOW);
    expect(results[0].route).toBe('/b');
    expect(results[1].route).toBe('/c');
    expect(results[2].route).toBe('/a');
  });

  it('respects custom weights', () => {
    const scorer = createRouteScorer({ errorRate: 1, callCount: 0, avgLatency: 0, recency: 0 });
    const low = scorer.score(makeInput({ errorRate: 0.1 }), NOW);
    const high = scorer.score(makeInput({ errorRate: 0.9 }), NOW);
    expect(high.score).toBeGreaterThan(low.score);
  });
});
