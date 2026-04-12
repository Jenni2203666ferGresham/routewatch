import { createExpressMiddleware } from './expressMiddleware';
import { RouteMetrics } from '../metrics/RouteMetrics';
import { Request, Response, NextFunction } from 'express';

function makeReq(method: string, path: string, routePath?: string): Partial<Request> {
  return {
    method,
    path,
    query: {},
    route: routePath ? { path: routePath } : undefined,
  } as Partial<Request>;
}

function makeRes(statusCode: number): Partial<Response> {
  const listeners: Record<string, (() => void)[]> = {};
  return {
    statusCode,
    on(event: string, cb: () => void) {
      listeners[event] = listeners[event] ?? [];
      listeners[event].push(cb);
      return this as unknown as Response;
    },
    emit(event: string) {
      (listeners[event] ?? []).forEach((cb) => cb());
      return true;
    },
  } as unknown as Partial<Response>;
}

describe('createExpressMiddleware', () => {
  let metrics: RouteMetrics;

  beforeEach(() => {
    metrics = new RouteMetrics();
  });

  it('records a request after response finishes', () => {
    const middleware = createExpressMiddleware(metrics);
    const req = makeReq('GET', '/users', '/users');
    const res = makeRes(200);
    const next: NextFunction = jest.fn();

    middleware(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();

    (res as any).emit('finish');

    const summary = metrics.getSummary('GET', '/users');
    expect(summary).not.toBeNull();
    expect(summary!.count).toBe(1);
  });

  it('ignores routes listed in ignoreRoutes', () => {
    const middleware = createExpressMiddleware(metrics, { ignoreRoutes: ['/health'] });
    const req = makeReq('GET', '/health', '/health');
    const res = makeRes(200);
    const next: NextFunction = jest.fn();

    middleware(req as Request, res as Response, next);
    (res as any).emit('finish');

    const summary = metrics.getSummary('GET', '/health');
    expect(summary).toBeNull();
  });

  it('falls back to req.path when route is not defined', () => {
    const middleware = createExpressMiddleware(metrics);
    const req = makeReq('POST', '/items');
    const res = makeRes(201);
    const next: NextFunction = jest.fn();

    middleware(req as Request, res as Response, next);
    (res as any).emit('finish');

    const summary = metrics.getSummary('POST', '/items');
    expect(summary).not.toBeNull();
  });
});
