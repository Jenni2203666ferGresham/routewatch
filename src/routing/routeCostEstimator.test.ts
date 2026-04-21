import {
  estimateRouteCost,
  rankByCost,
  createRouteCostEstimator,
  RouteCostInput,
} from './routeCostEstimator';

function makeInput(overrides: Partial<RouteCostInput> = {}): RouteCostInput {
  return {
    method: 'GET',
    path: '/api/test',
    avgLatencyMs: 50,
    callsPerMinute: 100,
    errorRate: 0.01,
    ...overrides,
  };
}

describe('estimateRouteCost', () => {
  it('returns a cost estimate with all fields', () => {
    const result = estimateRouteCost(makeInput());
    expect(result.method).toBe('GET');
    expect(result.path).toBe('/api/test');
    expect(typeof result.computeScore).toBe('number');
    expect(typeof result.networkScore).toBe('number');
    expect(typeof result.reliabilityPenalty).toBe('number');
    expect(typeof result.totalCost).toBe('number');
  });

  it('POST has higher compute score than GET for same latency', () => {
    const get = estimateRouteCost(makeInput({ method: 'GET' }));
    const post = estimateRouteCost(makeInput({ method: 'POST' }));
    expect(post.computeScore).toBeGreaterThan(get.computeScore);
  });

  it('higher error rate increases reliability penalty', () => {
    const low = estimateRouteCost(makeInput({ errorRate: 0.01 }));
    const high = estimateRouteCost(makeInput({ errorRate: 0.5 }));
    expect(high.reliabilityPenalty).toBeGreaterThan(low.reliabilityPenalty);
  });

  it('includes network score when payloadSizeBytes provided', () => {
    const noPayload = estimateRouteCost(makeInput());
    const withPayload = estimateRouteCost(makeInput({ payloadSizeBytes: 10240 }));
    expect(withPayload.networkScore).toBeGreaterThan(noPayload.networkScore);
  });

  it('uses default weight for unknown method', () => {
    const result = estimateRouteCost(makeInput({ method: 'CUSTOM' }));
    expect(result.totalCost).toBeGreaterThanOrEqual(0);
  });
});

describe('rankByCost', () => {
  it('sorts by totalCost descending', () => {
    const a = estimateRouteCost(makeInput({ avgLatencyMs: 200, callsPerMinute: 500 }));
    const b = estimateRouteCost(makeInput({ avgLatencyMs: 10, callsPerMinute: 5 }));
    const ranked = rankByCost([b, a]);
    expect(ranked[0].totalCost).toBeGreaterThanOrEqual(ranked[1].totalCost);
  });
});

describe('createRouteCostEstimator', () => {
  it('stores and retrieves estimates', () => {
    const estimator = createRouteCostEstimator();
    estimator.estimate(makeInput());
    const result = estimator.get('GET', '/api/test');
    expect(result).toBeDefined();
    expect(result?.path).toBe('/api/test');
  });

  it('getAll returns all estimates', () => {
    const estimator = createRouteCostEstimator();
    estimator.estimate(makeInput({ path: '/a' }));
    estimator.estimate(makeInput({ path: '/b' }));
    expect(estimator.getAll()).toHaveLength(2);
  });

  it('getRanked returns sorted estimates', () => {
    const estimator = createRouteCostEstimator();
    estimator.estimate(makeInput({ path: '/cheap', avgLatencyMs: 5, callsPerMinute: 1 }));
    estimator.estimate(makeInput({ path: '/expensive', avgLatencyMs: 500, callsPerMinute: 1000 }));
    const ranked = estimator.getRanked();
    expect(ranked[0].totalCost).toBeGreaterThanOrEqual(ranked[1].totalCost);
  });

  it('reset clears all estimates', () => {
    const estimator = createRouteCostEstimator();
    estimator.estimate(makeInput());
    estimator.reset();
    expect(estimator.getAll()).toHaveLength(0);
  });
});
