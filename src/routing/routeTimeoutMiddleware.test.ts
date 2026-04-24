import { createRouteTimeoutMiddleware } from './routeTimeoutMiddleware';

function makeReq(method = 'GET', path = '/test'): any {
  return { method, path, route: { path } };
}

function makeRes(): any {
  const listeners: Record<string, Array<() => void>> = {};
  return {
    on(event: string, cb: () => void) {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(cb);
    },
    emit(event: string) {
      (listeners[event] ?? []).forEach((cb) => cb());
    },
  };
}

describe('createRouteTimeoutMiddleware', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('records non-timeout when response finishes before deadline', () => {
    const mw = createRouteTimeoutMiddleware({ timeoutMs: 1000 });
    const req = makeReq();
    const res = makeRes();
    mw.middleware(req, res, () => {});
    res.emit('finish');
    jest.advanceTimersByTime(1000);
    const entry = mw.getTracker().getByMethod('GET', '/test');
    expect(entry).toBeDefined();
    expect(entry!.timeouts).toBe(0);
    expect(entry!.total).toBe(1);
  });

  it('records timeout when response does not finish in time', () => {
    const mw = createRouteTimeoutMiddleware({ timeoutMs: 500 });
    const req = makeReq('POST', '/slow');
    const res = makeRes();
    mw.middleware(req, res, () => {});
    jest.advanceTimersByTime(600);
    const entry = mw.getTracker().getByMethod('POST', '/slow');
    expect(entry).toBeDefined();
    expect(entry!.timeouts).toBe(1);
    expect(entry!.timeoutRate).toBe(1);
  });

  it('does not double-count when both close and finish fire', () => {
    const mw = createRouteTimeoutMiddleware({ timeoutMs: 1000 });
    const req = makeReq();
    const res = makeRes();
    mw.middleware(req, res, () => {});
    res.emit('finish');
    res.emit('close');
    const entry = mw.getTracker().getByMethod('GET', '/test');
    expect(entry!.total).toBe(1);
  });

  it('uses custom resolveRoute', () => {
    const mw = createRouteTimeoutMiddleware({
      timeoutMs: 1000,
      resolveRoute: () => '/custom',
    });
    const req = makeReq('GET', '/anything');
    const res = makeRes();
    mw.middleware(req, res, () => {});
    res.emit('finish');
    const entry = mw.getTracker().getByMethod('GET', '/custom');
    expect(entry).toBeDefined();
  });

  it('reset clears tracker state', () => {
    const mw = createRouteTimeoutMiddleware({ timeoutMs: 200 });
    const req = makeReq();
    const res = makeRes();
    mw.middleware(req, res, () => {});
    res.emit('finish');
    mw.reset();
    expect(mw.getTracker().getAll()).toHaveLength(0);
  });

  it('calls next()', () => {
    const mw = createRouteTimeoutMiddleware({ timeoutMs: 1000 });
    const next = jest.fn();
    mw.middleware(makeReq(), makeRes(), next);
    expect(next).toHaveBeenCalled();
  });
});
