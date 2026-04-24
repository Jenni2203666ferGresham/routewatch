import { createRouteRetryMiddleware } from './routeRetryMiddleware';

function makeReq(overrides: Record<string, any> = {}): any {
  return {
    method: 'GET',
    path: '/api/test',
    headers: {},
    ...overrides,
  };
}

function makeRes(): any {
  return {};
}

describe('createRouteRetryMiddleware', () => {
  it('calls next', () => {
    const { middleware } = createRouteRetryMiddleware();
    const next = jest.fn();
    middleware(makeReq(), makeRes(), next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('records request with no retry header', () => {
    const { middleware, getTracker } = createRouteRetryMiddleware();
    middleware(makeReq(), makeRes(), () => {});
    const entries = getTracker().getAll();
    expect(entries).toHaveLength(1);
    expect(entries[0].totalRetries).toBe(0);
    expect(entries[0].totalRequests).toBe(1);
  });

  it('reads retry count from x-retry-count header', () => {
    const { middleware, getTracker } = createRouteRetryMiddleware();
    middleware(
      makeReq({ headers: { 'x-retry-count': '3' } }),
      makeRes(),
      () => {}
    );
    const entries = getTracker().getAll();
    expect(entries[0].totalRetries).toBe(3);
    expect(entries[0].maxRetriesSeen).toBe(3);
  });

  it('uses custom resolveRoute option', () => {
    const { middleware, getTracker } = createRouteRetryMiddleware({
      resolveRoute: (req) => req.customRoute,
    });
    middleware(
      makeReq({ customRoute: '/custom/path' }),
      makeRes(),
      () => {}
    );
    const entries = getTracker().getAll();
    expect(entries[0].route).toBe('/custom/path');
  });

  it('uses custom resolveRetryCount option', () => {
    const { middleware, getTracker } = createRouteRetryMiddleware({
      resolveRetryCount: (req) => req.retries ?? 0,
    });
    middleware(makeReq({ retries: 7 }), makeRes(), () => {});
    expect(getTracker().getAll()[0].totalRetries).toBe(7);
  });

  it('reset clears tracker state', () => {
    const { middleware, getTracker, reset } = createRouteRetryMiddleware();
    middleware(makeReq(), makeRes(), () => {});
    reset();
    expect(getTracker().getAll()).toHaveLength(0);
  });

  it('accumulates multiple requests', () => {
    const { middleware, getTracker } = createRouteRetryMiddleware();
    for (let i = 0; i < 5; i++) {
      middleware(makeReq({ headers: { 'x-retry-count': '1' } }), makeRes(), () => {});
    }
    const entry = getTracker().getAll()[0];
    expect(entry.totalRequests).toBe(5);
    expect(entry.totalRetries).toBe(5);
  });
});
