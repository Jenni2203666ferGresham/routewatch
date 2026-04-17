import { createRouteWatcher, RouteChangeEvent } from './routeWatcher';

describe('createRouteWatcher', () => {
  it('records a registration event on watch', () => {
    const watcher = createRouteWatcher();
    watcher.watch('GET', '/users/:id');
    const history = watcher.getHistory();
    expect(history).toHaveLength(1);
    expect(history[0].type).toBe('registered');
    expect(history[0].method).toBe('GET');
    expect(history[0].path).toBe('/users/:id');
    expect(typeof history[0].timestamp).toBe('number');
  });

  it('records an unregistration event on unwatch', () => {
    const watcher = createRouteWatcher();
    watcher.watch('POST', '/items');
    watcher.unwatch('POST', '/items');
    const history = watcher.getHistory();
    expect(history).toHaveLength(2);
    expect(history[1].type).toBe('unregistered');
  });

  it('notifies onChange listeners', () => {
    const watcher = createRouteWatcher();
    const events: RouteChangeEvent[] = [];
    watcher.onChange((e) => events.push(e));
    watcher.watch('DELETE', '/resource');
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('registered');
  });

  it('returns unsubscribe function from onChange', () => {
    const watcher = createRouteWatcher();
    const events: RouteChangeEvent[] = [];
    const unsub = watcher.onChange((e) => events.push(e));
    unsub();
    watcher.watch('GET', '/ping');
    expect(events).toHaveLength(0);
  });

  it('getActive returns currently watched routes', () => {
    const watcher = createRouteWatcher();
    watcher.watch('GET', '/a');
    watcher.watch('POST', '/b');
    watcher.unwatch('GET', '/a');
    const active = watcher.getActive();
    expect(active).toHaveLength(1);
    expect(active[0].method).toBe('POST');
    expect(active[0].path).toBe('/b');
  });

  it('reset clears history and active routes', () => {
    const watcher = createRouteWatcher();
    watcher.watch('GET', '/test');
    watcher.reset();
    expect(watcher.getHistory()).toHaveLength(0);
    expect(watcher.getActive()).toHaveLength(0);
  });

  it('normalizedPath is set on events', () => {
    const watcher = createRouteWatcher();
    watcher.watch('GET', '/users/123');
    const [event] = watcher.getHistory();
    expect(typeof event.normalizedPath).toBe('string');
  });
});
