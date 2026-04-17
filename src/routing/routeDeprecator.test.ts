import { createRouteDeprecator } from './routeDeprecator';
import { createDeprecatorMiddleware } from './deprecatorMiddleware';
import { IncomingMessage, ServerResponse } from 'http';

describe('createRouteDeprecator', () => {
  it('marks a route as deprecated', () => {
    const d = createRouteDeprecator();
    d.deprecate('GET', '/old');
    expect(d.isDeprecated('GET', '/old')).toBe(true);
  });

  it('returns false for non-deprecated routes', () => {
    const d = createRouteDeprecator();
    expect(d.isDeprecated('GET', '/active')).toBe(false);
  });

  it('stores entry metadata', () => {
    const d = createRouteDeprecator();
    const sunset = new Date(Date.now() + 10000);
    d.deprecate('POST', '/submit', { replacement: '/v2/submit', sunsetAt: sunset });
    const entry = d.getEntry('POST', '/submit');
    expect(entry?.replacement).toBe('/v2/submit');
    expect(entry?.sunsetAt).toEqual(sunset);
  });

  it('undeprecates a route', () => {
    const d = createRouteDeprecator();
    d.deprecate('DELETE', '/gone');
    d.undeprecate('DELETE', '/gone');
    expect(d.isDeprecated('DELETE', '/gone')).toBe(false);
  });

  it('returns all entries', () => {
    const d = createRouteDeprecator();
    d.deprecate('GET', '/a');
    d.deprecate('POST', '/b');
    expect(d.getAll()).toHaveLength(2);
  });

  it('returns expired entries', () => {
    const d = createRouteDeprecator();
    const past = new Date(Date.now() - 1000);
    const future = new Date(Date.now() + 10000);
    d.deprecate('GET', '/old', { sunsetAt: past });
    d.deprecate('GET', '/soon', { sunsetAt: future });
    const expired = d.getExpired();
    expect(expired).toHaveLength(1);
    expect(expired[0].route).toBe('/old');
  });
});

describe('createDeprecatorMiddleware', () => {
  function makeReq(method: string, url: string): any {
    return { method, url, path: url, route: { path: url } };
  }

  function makeRes(): any {
    const headers: Record<string, string> = {};
    return {
      headers,
      setHeader(k: string, v: string) { headers[k] = v; },
      writeHead: jest.fn(),
      end: jest.fn(),
    };
  }

  it('calls next for non-deprecated routes', () => {
    const d = createRouteDeprecator();
    const mw = createDeprecatorMiddleware(d);
    const next = jest.fn();
    mw(makeReq('GET', '/active'), makeRes(), next);
    expect(next).toHaveBeenCalled();
  });

  it('sets Deprecation header for deprecated routes', () => {
    const d = createRouteDeprecator();
    d.deprecate('GET', '/old');
    const mw = createDeprecatorMiddleware(d, { warnHeader: true });
    const res = makeRes();
    const next = jest.fn();
    mw(makeReq('GET', '/old'), res, next);
    expect(res.headers['Deprecation']).toBeDefined();
    expect(next).toHaveBeenCalled();
  });

  it('blocks expired routes when blockExpired is true', () => {
    const d = createRouteDeprecator();
    d.deprecate('GET', '/gone', { sunsetAt: new Date(Date.now() - 1000) });
    const mw = createDeprecatorMiddleware(d, { blockExpired: true });
    const res = makeRes();
    const next = jest.fn();
    mw(makeReq('GET', '/gone'), res, next);
    expect(res.writeHead).toHaveBeenCalledWith(410, expect.any(Object));
    expect(next).not.toHaveBeenCalled();
  });

  it('calls onDeprecated callback', () => {
    const d = createRouteDeprecator();
    d.deprecate('GET', '/old');
    const onDeprecated = jest.fn();
    const mw = createDeprecatorMiddleware(d, { onDeprecated });
    mw(makeReq('GET', '/old'), makeRes(), jest.fn());
    expect(onDeprecated).toHaveBeenCalledWith('GET', '/old');
  });
});
