import { createRouteLifecycle } from './routeLifecycle';

describe('createRouteLifecycle', () => {
  it('records a transition', () => {
    const lc = createRouteLifecycle();
    lc.transition('/users', 'GET', 'registered');
    expect(lc.getCurrentState('/users', 'GET')).toBe('registered');
  });

  it('normalises method to uppercase', () => {
    const lc = createRouteLifecycle();
    lc.transition('/users', 'get', 'registered');
    expect(lc.getCurrentState('/users', 'GET')).toBe('registered');
  });

  it('allows valid transitions', () => {
    const lc = createRouteLifecycle();
    lc.transition('/users', 'GET', 'registered');
    lc.transition('/users', 'GET', 'activated');
    lc.transition('/users', 'GET', 'deprecated');
    expect(lc.getCurrentState('/users', 'GET')).toBe('deprecated');
  });

  it('throws on invalid transition', () => {
    const lc = createRouteLifecycle();
    lc.transition('/users', 'GET', 'registered');
    expect(() => lc.transition('/users', 'GET', 'deprecated')).toThrow(
      /Invalid lifecycle transition/
    );
  });

  it('throws when transitioning from removed', () => {
    const lc = createRouteLifecycle();
    lc.transition('/a', 'POST', 'registered');
    lc.transition('/a', 'POST', 'removed');
    expect(() => lc.transition('/a', 'POST', 'registered')).toThrow();
  });

  it('getHistory returns entries for a specific route', () => {
    const lc = createRouteLifecycle();
    lc.transition('/users', 'GET', 'registered');
    lc.transition('/users', 'GET', 'activated');
    lc.transition('/items', 'GET', 'registered');
    const hist = lc.getHistory('/users', 'GET');
    expect(hist).toHaveLength(2);
    expect(hist.every((e) => e.route === '/users')).toBe(true);
  });

  it('getAll returns every entry', () => {
    const lc = createRouteLifecycle();
    lc.transition('/a', 'GET', 'registered');
    lc.transition('/b', 'POST', 'registered');
    expect(lc.getAll()).toHaveLength(2);
  });

  it('getByEvent returns routes currently in that state', () => {
    const lc = createRouteLifecycle();
    lc.transition('/a', 'GET', 'registered');
    lc.transition('/a', 'GET', 'activated');
    lc.transition('/b', 'POST', 'registered');
    const activated = lc.getByEvent('activated');
    expect(activated).toHaveLength(1);
    expect(activated[0].route).toBe('/a');
  });

  it('stores meta on entry', () => {
    const lc = createRouteLifecycle();
    lc.transition('/x', 'DELETE', 'registered', { owner: 'team-a' });
    const hist = lc.getHistory('/x', 'DELETE');
    expect(hist[0].meta).toEqual({ owner: 'team-a' });
  });

  it('clear resets all state', () => {
    const lc = createRouteLifecycle();
    lc.transition('/a', 'GET', 'registered');
    lc.clear();
    expect(lc.getAll()).toHaveLength(0);
    expect(lc.getCurrentState('/a', 'GET')).toBeUndefined();
  });
});
