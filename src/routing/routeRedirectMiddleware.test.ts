import { IncomingMessage, ServerResponse } from 'http';
import { createRouteRedirectMiddleware } from './routeRedirectMiddleware';

function makeReq(url = '/old', method = 'GET'): IncomingMessage {
  return { url, method, headers: {} } as IncomingMessage;
}

function makeRes(locationHeader?: string): ServerResponse {
  const headers: Record<string, string> = {};
  if (locationHeader) headers['location'] = locationHeader;
  const res = {
    writeHead: jest.fn(),
    getHeader: (name: string) => headers[name],
    setHeader: jest.fn(),
  } as unknown as ServerResponse;
  return res;
}

describe('createRouteRedirectMiddleware', () => {
  it('records redirect when writeHead is called with 3xx status', () => {
    const handle = createRouteRedirectMiddleware();
    const req = makeReq('/old');
    const res = makeRes('/new');
    const next = jest.fn();

    handle.middleware(req, res, next);
    (res as any).writeHead(301);

    expect(next).toHaveBeenCalled();
    const entries = handle.getTracker().getAll();
    expect(entries).toHaveLength(1);
    expect(entries[0].fromRoute).toBe('/old');
    expect(entries[0].toRoute).toBe('/new');
    expect(entries[0].statusCode).toBe(301);
  });

  it('does not record redirect for non-3xx status', () => {
    const handle = createRouteRedirectMiddleware();
    const req = makeReq('/api/data');
    const res = makeRes('/other');
    const next = jest.fn();

    handle.middleware(req, res, next);
    (res as any).writeHead(200);

    expect(handle.getTracker().getAll()).toHaveLength(0);
  });

  it('uses custom resolveRoute when provided', () => {
    const handle = createRouteRedirectMiddleware({
      resolveRoute: () => '/custom-route',
    });
    const req = makeReq('/anything');
    const res = makeRes('/destination');
    const next = jest.fn();

    handle.middleware(req, res, next);
    (res as any).writeHead(302);

    const entry = handle.getTracker().getAll()[0];
    expect(entry.fromRoute).toBe('/custom-route');
  });

  it('reset clears tracker state', () => {
    const handle = createRouteRedirectMiddleware();
    const req = makeReq('/old');
    const res = makeRes('/new');
    handle.middleware(req, res, jest.fn());
    (res as any).writeHead(301);

    handle.reset();
    expect(handle.getTracker().getAll()).toHaveLength(0);
  });
});
