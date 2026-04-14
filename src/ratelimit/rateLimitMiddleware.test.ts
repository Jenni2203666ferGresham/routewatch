import { createRateLimitMiddleware } from './rateLimitMiddleware';
import { createRateLimitTracker } from './rateLimitTracker';
import { buildRateLimitConfig } from './rateLimitConfig';

function makeReq(method = 'GET', path = '/api/test'): any {
  return { method, path, ip: '127.0.0.1' };
}

function makeRes(statusCode = 200): any {
  const res: any = {
    statusCode,
    _headers: {} as Record<string, string>,
    getHeader: function (name: string) { return this._headers[name]; },
    setHeader: function (name: string, value: string) { this._headers[name] = value; },
    on: function (event: string, cb: () => void) {
      if (event === 'finish') setTimeout(cb, 0);
      return this;
    },
  };
  return res;
}

describe('createRateLimitMiddleware', () => {
  it('calls next for a normal request', (done) => {
    const config = buildRateLimitConfig({ windowMs: 60000, maxRequests: 100 });
    const tracker = createRateLimitTracker(config);
    const middleware = createRateLimitMiddleware(tracker, config);
    const req = makeReq();
    const res = makeRes();
    middleware(req, res, () => {
      expect(true).toBe(true);
      done();
    });
  });

  it('records requests in the tracker', (done) => {
    const config = buildRateLimitConfig({ windowMs: 60000, maxRequests: 100 });
    const tracker = createRateLimitTracker(config);
    const middleware = createRateLimitMiddleware(tracker, config);
    const req = makeReq('POST', '/api/submit');
    const res = makeRes();
    middleware(req, res, () => {
      const stats = tracker.getStatsForRoute('POST /api/submit');
      expect(stats).toBeDefined();
      expect(stats!.count).toBeGreaterThanOrEqual(1);
      done();
    });
  });

  it('blocks requests exceeding the limit', (done) => {
    const config = buildRateLimitConfig({ windowMs: 60000, maxRequests: 2 });
    const tracker = createRateLimitTracker(config);
    const middleware = createRateLimitMiddleware(tracker, config);
    const req = makeReq('GET', '/api/limited');
    let nextCallCount = 0;
    let blockedCount = 0;
    const runOne = (cb: () => void) => {
      const res = makeRes();
      res.status = (code: number) => { if (code === 429) blockedCount++; return res; };
      res.json = () => { cb(); return res; };
      middleware(req, res, () => { nextCallCount++; cb(); });
    };
    runOne(() => runOne(() => runOne(() => {
      expect(nextCallCount).toBe(2);
      expect(blockedCount).toBe(1);
      done();
    })));
  });

  it('sets RateLimit headers on response', (done) => {
    const config = buildRateLimitConfig({ windowMs: 60000, maxRequests: 50 });
    const tracker = createRateLimitTracker(config);
    const middleware = createRateLimitMiddleware(tracker, config);
    const req = makeReq();
    const res = makeRes();
    middleware(req, res, () => {
      expect(res.getHeader('X-RateLimit-Limit')).toBeDefined();
      expect(res.getHeader('X-RateLimit-Remaining')).toBeDefined();
      done();
    });
  });
});
