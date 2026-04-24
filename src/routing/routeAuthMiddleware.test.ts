import { createRouteAuthMiddleware } from './routeAuthMiddleware';
import { createRouteAuthTracker } from './routeAuthTracker';

function makeReq(path: string, method: string, authHeader?: string): any {
  return {
    path,
    method,
    headers: authHeader ? { authorization: authHeader } : {},
  };
}

function makeRes(statusCode = 200): any {
  const res: any = { statusCode, on: jest.fn() };
  return res;
}

describe('createRouteAuthMiddleware', () => {
  it('records authenticated request', () => {
    const tracker = createRouteAuthTracker();
    const middleware = createRouteAuthMiddleware({ tracker });
    const req = makeReq('/api/users', 'GET', 'Bearer token123');
    const res = makeRes(200);
    const next = jest.fn();

    middleware(req, res, next);
    expect(next).toHaveBeenCalled();

    // simulate finish
    const finishCb = res.on.mock.calls.find((c: any[]) => c[0] === 'finish')?.[1];
    finishCb?.();

    const stats = tracker.getAll();
    expect(stats.length).toBe(1);
    expect(stats[0].authenticated).toBe(true);
  });

  it('records unauthenticated request', () => {
    const tracker = createRouteAuthTracker();
    const middleware = createRouteAuthMiddleware({ tracker });
    const req = makeReq('/api/users', 'GET');
    const res = makeRes(401);
    const next = jest.fn();

    middleware(req, res, next);
    const finishCb = res.on.mock.calls.find((c: any[]) => c[0] === 'finish')?.[1];
    finishCb?.();

    const stats = tracker.getAll();
    expect(stats.length).toBe(1);
    expect(stats[0].authenticated).toBe(false);
  });

  it('groups by route and method', () => {
    const tracker = createRouteAuthTracker();
    const middleware = createRouteAuthMiddleware({ tracker });

    for (let i = 0; i < 3; i++) {
      const req = makeReq('/api/items', 'POST', 'Bearer x');
      const res = makeRes(201);
      middleware(req, res, jest.fn());
      const cb = res.on.mock.calls.find((c: any[]) => c[0] === 'finish')?.[1];
      cb?.();
    }

    const byRoute = tracker.getByRoute('/api/items', 'POST');
    expect(byRoute).not.toBeNull();
    expect(byRoute!.total).toBe(3);
    expect(byRoute!.authenticatedCount).toBe(3);
  });

  it('uses custom resolveAuth', () => {
    const tracker = createRouteAuthTracker();
    const middleware = createRouteAuthMiddleware({
      tracker,
      resolveAuth: (req) => req.headers['x-api-key'] !== undefined,
    });

    const req = makeReq('/api/secure', 'GET');
    req.headers['x-api-key'] = 'secret';
    const res = makeRes(200);
    middleware(req, res, jest.fn());
    const cb = res.on.mock.calls.find((c: any[]) => c[0] === 'finish')?.[1];
    cb?.();

    expect(tracker.getAll()[0].authenticated).toBe(true);
  });

  it('reset clears all entries', () => {
    const tracker = createRouteAuthTracker();
    const middleware = createRouteAuthMiddleware({ tracker });
    const req = makeReq('/api/x', 'DELETE', 'Bearer t');
    const res = makeRes(204);
    middleware(req, res, jest.fn());
    const cb = res.on.mock.calls.find((c: any[]) => c[0] === 'finish')?.[1];
    cb?.();
    expect(tracker.getAll().length).toBe(1);
    middleware.reset();
    expect(tracker.getAll().length).toBe(0);
  });
});
