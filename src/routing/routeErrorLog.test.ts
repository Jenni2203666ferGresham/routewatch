import { createRouteErrorLog, RouteErrorEntry } from './routeErrorLog';

function makeEntry(overrides: Partial<RouteErrorEntry> = {}): RouteErrorEntry {
  return {
    route: '/api/test',
    method: 'GET',
    statusCode: 500,
    message: 'Internal Server Error',
    timestamp: Date.now(),
    ...overrides,
  };
}

describe('createRouteErrorLog', () => {
  it('records entries and returns them via getAll', () => {
    const log = createRouteErrorLog();
    log.record(makeEntry());
    log.record(makeEntry({ route: '/api/other', statusCode: 404 }));
    expect(log.getAll()).toHaveLength(2);
  });

  it('filters by route', () => {
    const log = createRouteErrorLog();
    log.record(makeEntry({ route: '/api/foo' }));
    log.record(makeEntry({ route: '/api/bar' }));
    expect(log.getByRoute('/api/foo')).toHaveLength(1);
    expect(log.getByRoute('/api/foo')[0].route).toBe('/api/foo');
  });

  it('filters by method case-insensitively', () => {
    const log = createRouteErrorLog();
    log.record(makeEntry({ method: 'POST' }));
    log.record(makeEntry({ method: 'GET' }));
    expect(log.getByMethod('post')).toHaveLength(1);
  });

  it('filters by status code', () => {
    const log = createRouteErrorLog();
    log.record(makeEntry({ statusCode: 500 }));
    log.record(makeEntry({ statusCode: 404 }));
    log.record(makeEntry({ statusCode: 500 }));
    expect(log.getByStatusCode(500)).toHaveLength(2);
    expect(log.getByStatusCode(404)).toHaveLength(1);
  });

  it('filters entries since a given timestamp', () => {
    const log = createRouteErrorLog();
    const now = Date.now();
    log.record(makeEntry({ timestamp: now - 5000 }));
    log.record(makeEntry({ timestamp: now - 1000 }));
    log.record(makeEntry({ timestamp: now }));
    const recent = log.getSince(now - 2000);
    expect(recent).toHaveLength(2);
  });

  it('respects maxEntries limit by evicting oldest', () => {
    const log = createRouteErrorLog(3);
    log.record(makeEntry({ message: 'first' }));
    log.record(makeEntry({ message: 'second' }));
    log.record(makeEntry({ message: 'third' }));
    log.record(makeEntry({ message: 'fourth' }));
    expect(log.size()).toBe(3);
    expect(log.getAll()[0].message).toBe('second');
  });

  it('clears all entries', () => {
    const log = createRouteErrorLog();
    log.record(makeEntry());
    log.record(makeEntry());
    log.clear();
    expect(log.size()).toBe(0);
    expect(log.getAll()).toHaveLength(0);
  });

  it('stores traceId when provided', () => {
    const log = createRouteErrorLog();
    log.record(makeEntry({ traceId: 'abc-123' }));
    expect(log.getAll()[0].traceId).toBe('abc-123');
  });
});
