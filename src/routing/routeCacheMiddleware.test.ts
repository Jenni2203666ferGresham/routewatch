import { createRouteCacheMiddleware } from './routeCacheMiddleware';

function makeReq(
  method = 'GET',
  path = '/api/test',
  cacheHeader?: string
): { method: string; path: string; headers: Record<string, string> } {
  return {
    method,
    path,
    headers: cacheHeader ? { 'x-cache': cacheHeader } : {},
  };
}

describe('createRouteCacheMiddleware', () => {
  it('calls next', () => {
    const { middleware } = createRouteCacheMiddleware();
    const next = jest.fn();
    middleware(makeReq(), {}, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('records a hit when x-cache is HIT', () => {
    const { middleware, getTracker } = createRouteCacheMiddleware();
    const next = jest.fn();
    middleware(makeReq('GET', '/api/users', 'HIT'), {}, next);

    const entries = getTracker().getAll();
    expect(entries).toHaveLength(1);
    expect(entries[0].hits).toBe(1);
    expect(entries[0].misses).toBe(0);
  });

  it('records a miss when x-cache is MISS', () => {
    const { middleware, getTracker } = createRouteCacheMiddleware();
    const next = jest.fn();
    middleware(makeReq('GET', '/api/users', 'MISS'), {}, next);

    const entries = getTracker().getAll();
    expect(entries[0].misses).toBe(1);
    expect(entries[0].hits).toBe(0);
  });

  it('ignores requests without cache header', () => {
    const { middleware, getTracker } = createRouteCacheMiddleware();
    const next = jest.fn();
    middleware(makeReq('GET', '/api/none'), {}, next);
    expect(getTracker().getAll()).toHaveLength(0);
  });

  it('supports custom header and values', () => {
    const { middleware, getTracker } = createRouteCacheMiddleware({
      cacheHeader: 'x-custom-cache',
      hitValue: 'yes',
      missValue: 'no',
    });
    const next = jest.fn();
    const req = { method: 'GET', path: '/custom', headers: { 'x-custom-cache': 'yes' } };
    middleware(req, {}, next);
    const entries = getTracker().getAll();
    expect(entries[0].hits).toBe(1);
  });

  it('reset clears tracker state', () => {
    const { middleware, getTracker, reset } = createRouteCacheMiddleware();
    const next = jest.fn();
    middleware(makeReq('GET', '/api/reset', 'HIT'), {}, next);
    reset();
    expect(getTracker().getAll()).toHaveLength(0);
  });

  it('accumulates multiple requests', () => {
    const { middleware, getTracker } = createRouteCacheMiddleware();
    const next = jest.fn();
    middleware(makeReq('GET', '/api/data', 'HIT'), {}, next);
    middleware(makeReq('GET', '/api/data', 'HIT'), {}, next);
    middleware(makeReq('GET', '/api/data', 'MISS'), {}, next);
    const entry = getTracker().getAll()[0];
    expect(entry.hits).toBe(2);
    expect(entry.misses).toBe(1);
    expect(entry.hitRate).toBeCloseTo(2 / 3);
  });
});
