import { createRouteAccessLog, buildAccessLogFromStore, AccessLogEntry } from './routeAccessLog';
import { createMetricsStore } from '../metrics/MetricsStore';

function makeEntry(overrides: Partial<AccessLogEntry> = {}): AccessLogEntry {
  return {
    route: '/api/users',
    method: 'GET',
    statusCode: 200,
    latencyMs: 42,
    timestamp: Date.now(),
    ...overrides,
  };
}

describe('createRouteAccessLog', () => {
  it('starts empty', () => {
    const log = createRouteAccessLog();
    expect(log.size()).toBe(0);
    expect(log.getAll()).toEqual([]);
  });

  it('records entries', () => {
    const log = createRouteAccessLog();
    log.record(makeEntry());
    expect(log.size()).toBe(1);
  });

  it('caps at maxEntries', () => {
    const log = createRouteAccessLog(3);
    log.record(makeEntry({ route: '/a' }));
    log.record(makeEntry({ route: '/b' }));
    log.record(makeEntry({ route: '/c' }));
    log.record(makeEntry({ route: '/d' }));
    expect(log.size()).toBe(3);
    const routes = log.getAll().map((e) => e.route);
    expect(routes).toEqual(['/b', '/c', '/d']);
  });

  it('filters by route', () => {
    const log = createRouteAccessLog();
    log.record(makeEntry({ route: '/api/users' }));
    log.record(makeEntry({ route: '/api/posts' }));
    const result = log.getByRoute('/api/users');
    expect(result).toHaveLength(1);
    expect(result[0].route).toBe('/api/users');
  });

  it('filters by method case-insensitively', () => {
    const log = createRouteAccessLog();
    log.record(makeEntry({ method: 'GET' }));
    log.record(makeEntry({ method: 'POST' }));
    expect(log.getByMethod('get')).toHaveLength(1);
    expect(log.getByMethod('POST')).toHaveLength(1);
  });

  it('filters by status code', () => {
    const log = createRouteAccessLog();
    log.record(makeEntry({ statusCode: 200 }));
    log.record(makeEntry({ statusCode: 404 }));
    log.record(makeEntry({ statusCode: 500 }));
    expect(log.getByStatusCode(200)).toHaveLength(1);
    expect(log.getByStatusCode(404)).toHaveLength(1);
  });

  it('filters by timestamp', () => {
    const now = Date.now();
    const log = createRouteAccessLog();
    log.record(makeEntry({ timestamp: now - 5000 }));
    log.record(makeEntry({ timestamp: now - 1000 }));
    log.record(makeEntry({ timestamp: now }));
    const recent = log.getSince(now - 2000);
    expect(recent).toHaveLength(2);
  });

  it('clears all entries', () => {
    const log = createRouteAccessLog();
    log.record(makeEntry());
    log.record(makeEntry());
    log.clear();
    expect(log.size()).toBe(0);
  });
});

describe('buildAccessLogFromStore', () => {
  it('populates log from store metrics', () => {
    const store = createMetricsStore();
    store.record({ route: '/health', method: 'GET', statusCode: 200, latencyMs: 10, timestamp: Date.now() });
    store.record({ route: '/health', method: 'GET', statusCode: 500, latencyMs: 20, timestamp: Date.now() });
    const log = buildAccessLogFromStore(store);
    expect(log.size()).toBe(2);
    expect(log.getByStatusCode(500)).toHaveLength(1);
  });
});
