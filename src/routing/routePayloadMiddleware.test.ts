import { createRoutePayloadMiddleware } from './routePayloadMiddleware';

function makeReq(
  path = '/api/users',
  method = 'POST',
  contentLength = '128'
): any {
  return {
    path,
    method,
    headers: { 'content-length': contentLength },
    route: { path },
  };
}

function makeRes(): any {
  const res: any = {
    _ended: false,
    end(chunk?: any) {
      this._ended = true;
      return this;
    },
  };
  return res;
}

describe('createRoutePayloadMiddleware', () => {
  it('returns middleware, getTracker, and reset', () => {
    const { middleware, getTracker, reset } = createRoutePayloadMiddleware();
    expect(typeof middleware).toBe('function');
    expect(typeof getTracker).toBe('function');
    expect(typeof reset).toBe('function');
  });

  it('records request and response payload sizes on res.end', () => {
    const { middleware, getTracker } = createRoutePayloadMiddleware();
    const req = makeReq('/api/items', 'POST', '64');
    const res = makeRes();
    const next = jest.fn();

    middleware(req, res, next);
    expect(next).toHaveBeenCalled();

    const responseBody = Buffer.from('hello world');
    res.end(responseBody);

    const all = getTracker().getAll();
    expect(all.length).toBe(1);
    expect(all[0].route).toBe('/api/items');
    expect(all[0].method).toBe('POST');
    expect(all[0].totalRequestBytes).toBe(64);
    expect(all[0].totalResponseBytes).toBe(responseBody.byteLength);
  });

  it('handles missing content-length gracefully', () => {
    const { middleware, getTracker } = createRoutePayloadMiddleware();
    const req = makeReq('/ping', 'GET', '');
    req.headers['content-length'] = undefined;
    const res = makeRes();

    middleware(req, res, jest.fn());
    res.end('ok');

    const all = getTracker().getAll();
    expect(all[0].totalRequestBytes).toBe(0);
    expect(all[0].totalResponseBytes).toBe(Buffer.byteLength('ok'));
  });

  it('reset clears all recorded data', () => {
    const { middleware, getTracker, reset } = createRoutePayloadMiddleware();
    const req = makeReq();
    const res = makeRes();

    middleware(req, res, jest.fn());
    res.end('data');

    expect(getTracker().getAll().length).toBeGreaterThan(0);
    reset();
    expect(getTracker().getAll().length).toBe(0);
  });

  it('uses custom getRoute and getMethod options', () => {
    const { middleware, getTracker } = createRoutePayloadMiddleware({
      getRoute: () => '/custom/route',
      getMethod: () => 'PATCH',
    });
    const req = makeReq('/ignored', 'DELETE', '10');
    const res = makeRes();

    middleware(req, res, jest.fn());
    res.end(Buffer.from('resp'));

    const entry = getTracker().getAll()[0];
    expect(entry.route).toBe('/custom/route');
    expect(entry.method).toBe('PATCH');
  });
});
