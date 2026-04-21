import { createRouteTagIndexMiddleware } from './routeTagIndexMiddleware';
import type { Request, Response, NextFunction } from 'express';

function makeReq(overrides: Partial<Request> = {}): Request {
  return {
    method: 'GET',
    path: '/test',
    url: '/test',
    route: undefined,
    ...overrides,
  } as unknown as Request;
}

const makeRes = () => ({} as Response);
const makeNext = (): NextFunction => jest.fn() as unknown as NextFunction;

describe('createRouteTagIndexMiddleware', () => {
  it('calls next()', () => {
    const { middleware } = createRouteTagIndexMiddleware();
    const next = makeNext();
    middleware(makeReq(), makeRes(), next);
    expect(next).toHaveBeenCalled();
  });

  it('indexes default tags on each request', () => {
    const { middleware, getIndex } = createRouteTagIndexMiddleware({
      defaultTags: ['monitored'],
    });
    middleware(makeReq({ method: 'GET', path: '/api' } as any), makeRes(), makeNext());
    const tags = getIndex().getTags('GET', '/api');
    expect(tags).toContain('monitored');
  });

  it('indexes tags from getRouteTags option', () => {
    const { middleware, getIndex } = createRouteTagIndexMiddleware({
      getRouteTags: (req) => [(req as any).customTag].filter(Boolean),
    });
    const req = makeReq({ method: 'POST', path: '/orders', customTag: 'checkout' } as any);
    middleware(req, makeRes(), makeNext());
    expect(getIndex().getTags('POST', '/orders')).toContain('checkout');
  });

  it('merges default and dynamic tags', () => {
    const { middleware, getIndex } = createRouteTagIndexMiddleware({
      defaultTags: ['global'],
      getRouteTags: () => ['dynamic'],
    });
    middleware(makeReq({ method: 'PUT', path: '/profile' } as any), makeRes(), makeNext());
    const tags = getIndex().getTags('PUT', '/profile');
    expect(tags).toContain('global');
    expect(tags).toContain('dynamic');
  });

  it('does not add tags when none provided', () => {
    const { middleware, getIndex } = createRouteTagIndexMiddleware();
    middleware(makeReq(), makeRes(), makeNext());
    expect(getIndex().size()).toBe(0);
  });

  it('reset clears the index', () => {
    const { middleware, getIndex, reset } = createRouteTagIndexMiddleware({
      defaultTags: ['tag'],
    });
    middleware(makeReq({ method: 'GET', path: '/foo' } as any), makeRes(), makeNext());
    expect(getIndex().size()).toBeGreaterThan(0);
    reset();
    expect(getIndex().size()).toBe(0);
  });

  it('accepts an external index', () => {
    const { createRouteTagIndex } = require('./routeTagIndex');
    const shared = createRouteTagIndex();
    const { middleware } = createRouteTagIndexMiddleware({
      index: shared,
      defaultTags: ['shared-tag'],
    });
    middleware(makeReq({ method: 'GET', path: '/shared' } as any), makeRes(), makeNext());
    expect(shared.getTags('GET', '/shared')).toContain('shared-tag');
  });
});
