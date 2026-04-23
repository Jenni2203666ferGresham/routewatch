import { createRouteResponseCodeMiddleware } from './routeResponseCodeMiddleware';
import { createRouteResponseCodeTracker } from './routeResponseCodeTracker';
import { EventEmitter } from 'events';

function makeReq(method = 'GET', path = '/users', routePath?: string): any {
  return {
    method,
    path,
    route: routePath ? { path: routePath } : undefined,
  };
}

function makeRes(statusCode = 200): any {
  const emitter = new EventEmitter();
  return Object.assign(emitter, { statusCode });
}

describe('createRouteResponseCodeMiddleware', () => {
  it('records status code on response finish', () => {
    const tracker = createRouteResponseCodeTracker();
    const { middleware } = createRouteResponseCodeMiddleware(tracker);
    const req = makeReq('GET', '/users', '/users');
    const res = makeRes(200);
    const next = jest.fn();

    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
    res.emit('finish');

    const all = tracker.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].statusCode).toBe(200);
    expect(all[0].method).toBe('GET');
  });

  it('falls back to req.path when route is not set', () => {
    const tracker = createRouteResponseCodeTracker();
    const { middleware } = createRouteResponseCodeMiddleware(tracker);
    const req = makeReq('POST', '/fallback');
    const res = makeRes(201);
    const next = jest.fn();

    middleware(req, res, next);
    res.emit('finish');

    const all = tracker.getAll();
    expect(all[0].route).toBe('/fallback');
    expect(all[0].statusCode).toBe(201);
  });

  it('getTracker returns the underlying tracker', () => {
    const tracker = createRouteResponseCodeTracker();
    const mw = createRouteResponseCodeMiddleware(tracker);
    expect(mw.getTracker()).toBe(tracker);
  });

  it('reset clears tracker state', () => {
    const tracker = createRouteResponseCodeTracker();
    const mw = createRouteResponseCodeMiddleware(tracker);
    const req = makeReq('GET', '/ping', '/ping');
    const res = makeRes(200);
    mw.middleware(req, res, jest.fn());
    res.emit('finish');
    expect(tracker.getAll()).toHaveLength(1);
    mw.reset();
    expect(tracker.getAll()).toHaveLength(0);
  });

  it('creates its own tracker when none provided', () => {
    const mw = createRouteResponseCodeMiddleware();
    expect(mw.getTracker()).toBeDefined();
  });
});
