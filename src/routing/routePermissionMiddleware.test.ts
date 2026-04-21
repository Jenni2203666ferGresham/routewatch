import { IncomingMessage, ServerResponse } from 'http';
import { createRoutePermissionMiddleware } from './routePermissionMiddleware';
import { createRoutePermissionMap } from './routePermissionMap';

function makeReq(method: string, url: string, routePath?: string): IncomingMessage & { routePath?: string } {
  return { method, url, routePath } as IncomingMessage & { routePath?: string };
}

function makeRes(): { statusCode: number; headers: Record<string, string>; body: string; writeHead: jest.Mock; end: jest.Mock } {
  const res = { statusCode: 200, headers: {} as Record<string, string>, body: '' } as any;
  res.writeHead = jest.fn((code: number, headers: Record<string, string>) => {
    res.statusCode = code;
    Object.assign(res.headers, headers);
  });
  res.end = jest.fn((data: string) => { res.body = data; });
  return res;
}

describe('createRoutePermissionMiddleware', () => {
  it('calls next route has no permissions', () => {
    const map = createRoutePermissionMap();
    const { middleware } = createRoutePermissionMiddleware getUserPermissions: () => [] });
    const next = jest.fn();
    middleware(makeReq('GET', '/open'), makeRes() as unknown as ServerResponse, next);
    expect(next).toHaveBeenCalled();
  });

  it('calls next when user has required permissions', () => {
    const map = createRoutePermissionMap();
    map.assign('GET', '/admin', ['admin:read']);
    const { middleware } = createRoutePermissionMiddleware({
      map,
      getUserPermissions: () => ['admin:read'],
    });
    const next = jest.fn();
    middleware(makeReq('GET', '/admin', '/admin'), makeRes() as unknown as ServerResponse, next);
    expect(next).toHaveBeenCalled();
  });

  it('calls onDenied when user lacks permissions', () => {
    const map = createRoutePermissionMap();
    map.assign('DELETE', '/admin', ['admin:delete']);
    const onDenied = jest.fn();
    const { middleware } = createRoutePermissionMiddleware({
      map,
      getUserPermissions: () => [],
      onDenied,
    });
    const next = jest.fn();
    middleware(makeReq('DELETE', '/admin', '/admin'), makeRes() as unknown as ServerResponse, next);
    expect(onDenied).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('uses default 403 response when onDenied not provided', () => {
    const map = createRoutePermissionMap();
    map.assign('POST', '/secure', ['secure:write']);
    const { middleware } = createRoutePermissionMiddleware({
      map,
      getUserPermissions: () => [],
    });
    const res = makeRes();
    const next = jest.fn();
    middleware(makeReq('POST', '/secure', '/secure'), res as unknown as ServerResponse, next);
    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('getMap returns the underlying permission map', () => {
    const map = createRoutePermissionMap();
    const { getMap } = createRoutePermissionMiddleware({ map, getUserPermissions: () => [] });
    expect(getMap()).toBe(map);
  });

  it('falls back to req.url when routePath is absent', () => {
    const map = createRoutePermissionMap();
    map.assign('GET', '/by-url', ['url:read']);
    const { middleware } = createRoutePermissionMiddleware({
      map,
      getUserPermissions: () => ['url:read'],
    });
    const next = jest.fn();
    middleware(makeReq('GET', '/by-url'), makeRes() as unknown as ServerResponse, next);
    expect(next).toHaveBeenCalled();
  });
});
