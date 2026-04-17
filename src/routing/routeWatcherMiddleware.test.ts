import { createRouteWatcherMiddleware } from './routeWatcherMiddleware';
import { createRouteWatcher } from './routeWatcher';

function makeReq(method: string, path: string, routePath?: string): any {
  return {
    method,
    path,
    url: path,
    route: routePath ? { path: routePath } : undefined,
  };
}

function makeRes(): any {
  return {};
}

describe('createRouteWatcherMiddleware', () => {
  it('registers new routes seen in requests', () => {
    const { middleware, getWatcher } = createRouteWatcherMiddleware();
    const next = jest.fn();
    middleware(makeReq('GET', '/users'), makeRes(), next);
    expect(next).toHaveBeenCalled();
    const active = getWatcher().getActive();
    expect(active).toHaveLength(1);
    expect(active[0].method).toBe('GET');
    expect(active[0].path).toBe('/users');
  });

  it('does not double-register the same route', () => {
    const { middleware, getWatcher } = createRouteWatcherMiddleware();
    const next = jest.fn();
    middleware(makeReq('GET', '/ping'), makeRes(), next);
    middleware(makeReq('GET', '/ping'), makeRes(), next);
    expect(getWatcher().getActive()).toHaveLength(1);
  });

  it('uses route.path when available', () => {
    const { middleware, getWatcher } = createRouteWatcherMiddleware();
    const next = jest.fn();
    middleware(makeReq('GET', '/users/42', '/users/:id'), makeRes(), next);
    const active = getWatcher().getActive();
    expect(active[0].path).toBe('/users/:id');
  });

  it('calls onNew callback for newly discovered routes', () => {
    const discovered: string[] = [];
    const { middleware } = createRouteWatcherMiddleware({
      onNew: (method, path) => discovered.push(`${method} ${path}`),
    });
    const next = jest.fn();
    middleware(makeReq('POST', '/items'), makeRes(), next);
    expect(discovered).toContain('POST /items');
  });

  it('accepts an external watcher', () => {
    const watcher = createRouteWatcher();
    const { middleware, getWatcher } = createRouteWatcherMiddleware({ watcher });
    middleware(makeReq('DELETE', '/things'), makeRes(), jest.fn());
    expect(getWatcher()).toBe(watcher);
    expect(watcher.getActive()).toHaveLength(1);
  });

  it('registers different methods for same path as separate entries', () => {
    const { middleware, getWatcher } = createRouteWatcherMiddleware();
    middleware(makeReq('GET', '/data'), makeRes(), jest.fn());
    middleware(makeReq('POST', '/data'), makeRes(), jest.fn());
    expect(getWatcher().getActive()).toHaveLength(2);
  });
});
