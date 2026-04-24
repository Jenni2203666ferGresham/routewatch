import { createRouteRequestCounterMiddleware } from './routeRequestCounterMiddleware';
import { createRouteRequestCounter } from './routeRequestCounter';

function makeReq(
  method = 'GET',
  path = '/test',
  routePath?: string
): Record<string, unknown> {
  return {
    method,
    path,
    route: routePath ? { path: routePath } : undefined,
  };
}

function makeRes(): Record<string, unknown> {
  return {};
}

describe('createRouteRequestCounterMiddleware', () => {
  it('calls next after recording', () => {
    const mw = createRouteRequestCounterMiddleware();
    const next = jest.fn();
    mw.middleware(makeReq() as any, makeRes() as any, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('records the request in the counter', () => {
    const mw = createRouteRequestCounterMiddleware();
    mw.middleware(makeReq('GET', '/users') as any, makeRes() as any, () => {});
    expect(mw.getCounter().getCount('GET', '/users')).toBe(1);
  });

  it('uses route.path when available', () => {
    const mw = createRouteRequestCounterMiddleware();
    mw.middleware(
      makeReq('GET', '/users/123', '/users/:id') as any,
      makeRes() as any,
      () => {}
    );
    expect(mw.getCounter().getCount('GET', '/users/:id')).toBe(1);
  });

  it('accumulates multiple requests', () => {
    const mw = createRouteRequestCounterMiddleware();
    const req = makeReq('POST', '/items') as any;
    const res = makeRes() as any;
    mw.middleware(req, res, () => {});
    mw.middleware(req, res, () => {});
    mw.middleware(req, res, () => {});
    expect(mw.getCounter().getCount('POST', '/items')).toBe(3);
  });

  it('reset clears counter state', () => {
    const mw = createRouteRequestCounterMiddleware();
    mw.middleware(makeReq('DELETE', '/x') as any, makeRes() as any, () => {});
    mw.reset();
    expect(mw.getCounter().getAll()).toHaveLength(0);
  });

  it('accepts an external counter', () => {
    const counter = createRouteRequestCounter();
    counter.record('GET', '/pre-existing');
    const mw = createRouteRequestCounterMiddleware(counter);
    mw.middleware(makeReq('GET', '/new') as any, makeRes() as any, () => {});
    expect(mw.getCounter().getAll()).toHaveLength(2);
  });
});
