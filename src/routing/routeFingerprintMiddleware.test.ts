import { createRouteFingerprintMiddleware } from './routeFingerprintMiddleware';
import type { Request, Response } from 'express';

function makeReq(overrides: Partial<Request> = {}): Request {
  return {
    method: 'GET',
    path: '/test',
    route: { path: '/test' },
    headers: {},
    query: {},
    body: {},
    ...overrides,
  } as unknown as Request;
}

function makeRes(): Response {
  return {} as Response;
}

describe('createRouteFingerprintMiddleware', () => {
  it('records a fingerprint and calls next', () => {
    const mw = createRouteFingerprintMiddleware();
    const req = makeReq();
    const next = jest.fn();
    mw.middleware(req, makeRes(), next);
    expect(next).toHaveBeenCalled();
    const entry = mw.getTracker().getByRoute('GET', '/test');
    expect(entry).toBeDefined();
  });

  it('attaches routeFingerprint to req', () => {
    const mw = createRouteFingerprintMiddleware();
    const req = makeReq();
    mw.middleware(req, makeRes(), jest.fn());
    expect((req as any).routeFingerprint).toBeDefined();
    expect(typeof (req as any).routeFingerprint).toBe('string');
  });

  it('uses custom resolveRoute', () => {
    const mw = createRouteFingerprintMiddleware({
      resolveRoute: () => '/custom-route',
    });
    const req = makeReq();
    mw.middleware(req, makeRes(), jest.fn());
    const entry = mw.getTracker().getByRoute('GET', '/custom-route');
    expect(entry).toBeDefined();
  });

  it('uses custom computeFingerprint', () => {
    const mw = createRouteFingerprintMiddleware({
      computeFingerprint: () => 'static-fp',
    });
    const req = makeReq();
    mw.middleware(req, makeRes(), jest.fn());
    expect((req as any).routeFingerprint).toBe('static-fp');
  });

  it('generates different fingerprints for different query keys', () => {
    const mw = createRouteFingerprintMiddleware();
    const req1 = makeReq({ query: { a: '1' } as any });
    const req2 = makeReq({ path: '/test2', route: { path: '/test2' } as any, query: { b: '2' } as any });
    mw.middleware(req1, makeRes(), jest.fn());
    mw.middleware(req2, makeRes(), jest.fn());
    const fp1 = (req1 as any).routeFingerprint;
    const fp2 = (req2 as any).routeFingerprint;
    expect(fp1).not.toBe(fp2);
  });

  it('reset clears tracker state', () => {
    const mw = createRouteFingerprintMiddleware();
    mw.middleware(makeReq(), makeRes(), jest.fn());
    mw.reset();
    expect(mw.getTracker().getAll()).toHaveLength(0);
  });
});
