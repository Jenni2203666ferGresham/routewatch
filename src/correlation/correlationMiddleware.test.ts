import { createCorrelationTracker } from './correlationTracker';
import { createCorrelationMiddleware } from './correlationMiddleware';
import { MetricsStore } from '../metrics/MetricsStore';
import { EventEmitter } from 'events';

function makeStore(): MetricsStore {
  const records: any[] = [];
  return {
    record: (m: any) => records.push(m),
    getAll: () => records,
    getRoutes: () => [],
    clear: () => records.splice(0),
  } as unknown as MetricsStore;
}

function makeReq(overrides: Record<string, any> = {}): any {
  return {
    method: 'GET',
    path: '/api/hello',
    headers: {},
    route: { path: '/api/hello' },
    ...overrides,
  };
}

function makeRes(): any {
  const emitter = new EventEmitter();
  const headers: Record<string, string> = {};
  return Object.assign(emitter, {
    statusCode: 200,
    setHeader: (k: string, v: string) => { headers[k] = v; },
    getHeaders: () => headers,
    _headers: headers,
  });
}

describe('createCorrelationMiddleware', () => {
  it('sets a trace id header on the response', () => {
    const tracker = createCorrelationTracker();
    const store = makeStore();
    const middleware = createCorrelationMiddleware(tracker, store);
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();
    middleware(req, res, next);
    expect(res.getHeaders()['x-trace-id']).toBeDefined();
    expect(next).toHaveBeenCalled();
  });

  it('uses existing trace id from request header', () => {
    const tracker = createCorrelationTracker();
    const store = makeStore();
    const middleware = createCorrelationMiddleware(tracker, store);
    const req = makeReq({ headers: { 'x-trace-id': 'existing-id' } });
    const res = makeRes();
    middleware(req, res, jest.fn());
    expect(res.getHeaders()['x-trace-id']).toBe('existing-id');
  });

  it('records entry in tracker on response finish', () => {
    const tracker = createCorrelationTracker();
    const store = makeStore();
    const middleware = createCorrelationMiddleware(tracker, store);
    const req = makeReq({ headers: { 'x-trace-id': 'trace-42' } });
    const res = makeRes();
    middleware(req, res, jest.fn());
    res.emit('finish');
    const entry = tracker.getByTraceId('trace-42');
    expect(entry).toBeDefined();
    expect(entry?.route).toBe('/api/hello');
    expect(entry?.statusCode).toBe(200);
  });

  it('supports custom traceIdHeader option', () => {
    const tracker = createCorrelationTracker();
    const store = makeStore();
    const middleware = createCorrelationMiddleware(tracker, store, { traceIdHeader: 'x-request-id' });
    const req = makeReq({ headers: { 'x-request-id': 'custom-id' } });
    const res = makeRes();
    middleware(req, res, jest.fn());
    expect(res.getHeaders()['x-request-id']).toBe('custom-id');
  });
});
