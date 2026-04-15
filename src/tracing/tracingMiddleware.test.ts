import { createTracingMiddleware } from './tracingMiddleware';
import {
  createTraceContextStore,
  getActiveTraces,
  getCompletedTraces,
} from './traceContext';

function makeReq(overrides: Record<string, unknown> = {}) {
  return {
    method: 'GET',
    path: '/api/test',
    headers: {},
    route: { path: '/api/test' },
    ...overrides,
  } as any;
}

function makeRes() {
  const listeners: Record<string, (() => void)[]> = {};
  return {
    headers: {} as Record<string, string>,
    setHeader(key: string, val: string) {
      this.headers[key] = val;
    },
    on(event: string, cb: () => void) {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(cb);
    },
    emit(event: string) {
      (listeners[event] || []).forEach((cb) => cb());
    },
  } as any;
}

describe('createTracingMiddleware', () => {
  it('starts a trace on request', () => {
    const store = createTraceContextStore();
    const middleware = createTracingMiddleware(store);
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();
    middleware(req, res, next);
    expect(getActiveTraces(store)).toHaveLength(1);
    expect(next).toHaveBeenCalled();
  });

  it('sets trace headers on response', () => {
    const store = createTraceContextStore();
    const middleware = createTracingMiddleware(store);
    const req = makeReq({ headers: { 'x-trace-id': 'my-trace' } });
    const res = makeRes();
    middleware(req, res, jest.fn());
    expect(res.headers['x-trace-id']).toBe('my-trace');
    expect(res.headers['x-span-id']).toBeDefined();
  });

  it('finishes trace on response finish', () => {
    const store = createTraceContextStore();
    const middleware = createTracingMiddleware(store);
    const req = makeReq();
    const res = makeRes();
    middleware(req, res, jest.fn());
    res.emit('finish');
    expect(getActiveTraces(store)).toHaveLength(0);
    expect(getCompletedTraces(store)).toHaveLength(1);
  });

  it('calls onFinish callback with trace context', () => {
    const store = createTraceContextStore();
    const onFinish = jest.fn();
    const middleware = createTracingMiddleware(store, { onFinish });
    const req = makeReq();
    const res = makeRes();
    middleware(req, res, jest.fn());
    res.emit('finish');
    expect(onFinish).toHaveBeenCalledWith(expect.objectContaining({ route: '/api/test' }));
  });

  it('uses custom getRoute function', () => {
    const store = createTraceContextStore();
    const middleware = createTracingMiddleware(store, {
      getRoute: () => '/custom/route',
    });
    const req = makeReq();
    const res = makeRes();
    middleware(req, res, jest.fn());
    expect(getActiveTraces(store)[0].route).toBe('/custom/route');
  });
});
