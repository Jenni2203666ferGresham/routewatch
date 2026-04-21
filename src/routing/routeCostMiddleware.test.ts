import { createRouteCostMiddleware } from './routeCostMiddleware';
import { MetricsStore } from '../metrics/MetricsStore';
import { IncomingMessage, ServerResponse } from 'http';

function makeStore(routes: Record<string, { latencies: number[]; count: number; errorCount: number }>): MetricsStore {
  return {
    getAll: () => routes,
    record: jest.fn(),
    get: jest.fn(),
    reset: jest.fn(),
  } as unknown as MetricsStore;
}

function makeReq(): IncomingMessage {
  return {} as IncomingMessage;
}

function makeRes(): ServerResponse {
  return {} as ServerResponse;
}

describe('createRouteCostMiddleware', () => {
  it('calls next after middleware executes', () => {
    const store = makeStore({});
    const handle = createRouteCostMiddleware({ store });
    const next = jest.fn();
    handle.middleware(makeReq(), makeRes(), next);
    expect(next).toHaveBeenCalled();
  });

  it('populates estimates from store data', () => {
    const store = makeStore({
      'GET:/api/users': { latencies: [100, 200], count: 60, errorCount: 3 },
    });
    const handle = createRouteCostMiddleware({ store });
    handle.middleware(makeReq(), makeRes(), jest.fn());
    const estimates = handle.getEstimates();
    expect(estimates.length).toBeGreaterThan(0);
    expect(estimates[0].method).toBe('GET');
    expect(estimates[0].path).toBe('/api/users');
  });

  it('getRanked returns sorted estimates', () => {
    const store = makeStore({
      'GET:/cheap': { latencies: [5], count: 1, errorCount: 0 },
      'POST:/expensive': { latencies: [800], count: 500, errorCount: 50 },
    });
    const handle = createRouteCostMiddleware({ store });
    handle.middleware(makeReq(), makeRes(), jest.fn());
    const ranked = handle.getRanked();
    expect(ranked[0].totalCost).toBeGreaterThanOrEqual(ranked[ranked.length - 1].totalCost);
  });

  it('reset clears estimates', () => {
    const store = makeStore({
      'GET:/api/users': { latencies: [100], count: 10, errorCount: 0 },
    });
    const handle = createRouteCostMiddleware({ store });
    handle.middleware(makeReq(), makeRes(), jest.fn());
    handle.reset();
    expect(handle.getEstimates()).toHaveLength(0);
  });

  it('handles empty store gracefully', () => {
    const store = makeStore({});
    const handle = createRouteCostMiddleware({ store });
    handle.middleware(makeReq(), makeRes(), jest.fn());
    expect(handle.getEstimates()).toHaveLength(0);
  });
});
