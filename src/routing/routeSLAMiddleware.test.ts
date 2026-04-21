import { createSLAMiddleware } from './routeSLAMiddleware';
import { SLAStatus } from './routeSLATracker';
import { EventEmitter } from 'events';

function makeReq(url = '/api/users', method = 'GET'): any {
  const em = new EventEmitter();
  return Object.assign(em, { url, method, routePath: url });
}

function makeRes(statusCode = 200): any {
  const em = new EventEmitter();
  return Object.assign(em, { statusCode });
}

describe('createSLAMiddleware', () => {
  it('calls next immediately', () => {
    const { middleware } = createSLAMiddleware();
    const next = jest.fn();
    middleware(makeReq(), makeRes(), next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('does not call onViolation when no target registered', () => {
    const onViolation = jest.fn();
    const { middleware } = createSLAMiddleware({ onViolation });
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();
    middleware(req, res, next);
    res.emit('finish');
    expect(onViolation).not.toHaveBeenCalled();
  });

  it('does not call onViolation when SLA passes', () => {
    const onViolation = jest.fn();
    const { middleware } = createSLAMiddleware({
      targets: [{ route: '/api/users', method: 'GET', maxLatencyP99Ms: 5000, maxErrorRatePct: 50, minUptimePct: 0 }],
      onViolation,
    });
    const req = makeReq();
    const res = makeRes(200);
    middleware(req, res, jest.fn());
    res.emit('finish');
    expect(onViolation).not.toHaveBeenCalled();
  });

  it('calls onViolation when error rate exceeds target', () => {
    const violations: SLAStatus[] = [];
    const { middleware } = createSLAMiddleware({
      targets: [{ route: '/api/users', method: 'GET', maxLatencyP99Ms: 5000, maxErrorRatePct: 0, minUptimePct: 0 }],
      onViolation: (s) => violations.push(s),
    });
    const req = makeReq();
    const res = makeRes(500);
    middleware(req, res, jest.fn());
    res.emit('finish');
    expect(violations).toHaveLength(1);
    expect(violations[0].errorRateOk).toBe(false);
    expect(violations[0].passing).toBe(false);
  });

  it('exposes tracker with added targets', () => {
    const { getTracker } = createSLAMiddleware({
      targets: [{ route: '/api/users', method: 'GET', maxLatencyP99Ms: 200, maxErrorRatePct: 5, minUptimePct: 99 }],
    });
    expect(getTracker().getTargets()).toHaveLength(1);
  });

  it('reset clears window data', () => {
    const onViolation = jest.fn();
    const { middleware, reset } = createSLAMiddleware({
      targets: [{ route: '/api/users', method: 'GET', maxLatencyP99Ms: 5000, maxErrorRatePct: 0, minUptimePct: 0 }],
      onViolation,
    });
    const req = makeReq();
    const res = makeRes(500);
    middleware(req, res, jest.fn());
    res.emit('finish');
    reset();
    // after reset a new window starts — second 500 should still trigger violation
    const req2 = makeReq();
    const res2 = makeRes(500);
    middleware(req2, res2, jest.fn());
    res2.emit('finish');
    expect(onViolation).toHaveBeenCalledTimes(2);
  });
});
