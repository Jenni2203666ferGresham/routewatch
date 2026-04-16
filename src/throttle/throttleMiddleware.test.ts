import { createThrottleMiddleware } from './throttleMiddleware';
import { createThrottleTracker } from './throttleTracker';
import { buildThrottleConfig } from './throttleConfig';

function makeReq(path: string, method = 'GET', ip = '127.0.0.1') {
  return { path, method, ip, socket: { remoteAddress: ip } } as any;
}

function makeRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

/** Helper to fire middleware N times with the same req/res/next */
function fireMiddleware(middleware: Function, req: any, res: any, next: jest.Mock, times: number) {
  for (let i = 0; i < times; i++) {
    middleware(req, res, next);
  }
}

describe('createThrottleMiddleware', () => {
  it('calls next() when under the rate limit', () => {
    const config = buildThrottleConfig({ maxRequests: 5, windowMs: 1000 });
    const tracker = createThrottleTracker(config);
    const middleware = createThrottleMiddleware(tracker, config);
    const req = makeReq('/api/test');
    const res = makeRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 429 when rate limit is exceeded', () => {
    const config = buildThrottleConfig({ maxRequests: 2, windowMs: 1000 });
    const tracker = createThrottleTracker(config);
    const middleware = createThrottleMiddleware(tracker, config);
    const req = makeReq('/api/test');
    const res = makeRes();
    const next = jest.fn();

    fireMiddleware(middleware, req, res, next, 3);

    expect(next).toHaveBeenCalledTimes(2);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.any(String) })
    );
  });

  it('tracks different routes independently', () => {
    const config = buildThrottleConfig({ maxRequests: 1, windowMs: 1000 });
    const tracker = createThrottleTracker(config);
    const middleware = createThrottleMiddleware(tracker, config);
    const next = jest.fn();

    middleware(makeReq('/api/a'), makeRes(), next);
    middleware(makeReq('/api/b'), makeRes(), next);

    expect(next).toHaveBeenCalledTimes(2);
  });

  it('uses ip-based key when perIp is enabled', () => {
    const config = buildThrottleConfig({ maxRequests: 1, windowMs: 1000, perIp: true });
    const tracker = createThrottleTracker(config);
    const middleware = createThrottleMiddleware(tracker, config);
    const next = jest.fn();
    const res1 = makeRes();
    const res2 = makeRes();

    middleware(makeReq('/api/test', 'GET', '10.0.0.1'), res1, next);
    middleware(makeReq('/api/test', 'GET', '10.0.0.2'), res2, next);

    expect(next).toHaveBeenCalledTimes(2);
    expect(res1.status).not.toHaveBeenCalled();
    expect(res2.status).not.toHaveBeenCalled();
  });
});
