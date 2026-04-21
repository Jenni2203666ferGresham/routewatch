import { createRouteTagIndex } from './routeTagIndex';

describe('createRouteTagIndex', () => {
  it('adds and retrieves tags for a route', () => {
    const idx = createRouteTagIndex();
    idx.addTags('GET', '/users', ['public', 'v1']);
    expect(idx.getTags('GET', '/users')).toEqual(expect.arrayContaining(['public', 'v1']));
  });

  it('returns empty array for unknown route', () => {
    const idx = createRouteTagIndex();
    expect(idx.getTags('GET', '/unknown')).toEqual([]);
  });

  it('removes specific tags', () => {
    const idx = createRouteTagIndex();
    idx.addTags('POST', '/items', ['admin', 'v2', 'beta']);
    idx.removeTags('POST', '/items', ['beta']);
    const tags = idx.getTags('POST', '/items');
    expect(tags).toContain('admin');
    expect(tags).toContain('v2');
    expect(tags).not.toContain('beta');
  });

  it('removes route entry when all tags removed', () => {
    const idx = createRouteTagIndex();
    idx.addTags('DELETE', '/old', ['deprecated']);
    idx.removeTags('DELETE', '/old', ['deprecated']);
    expect(idx.getTags('DELETE', '/old')).toEqual([]);
    expect(idx.size()).toBe(0);
  });

  it('returns routes by tag', () => {
    const idx = createRouteTagIndex();
    idx.addTags('GET', '/a', ['public']);
    idx.addTags('POST', '/b', ['public', 'auth']);
    idx.addTags('GET', '/c', ['auth']);
    const publicRoutes = idx.getRoutesByTag('public');
    expect(publicRoutes).toHaveLength(2);
    const paths = publicRoutes.map((r) => r.path);
    expect(paths).toContain('/a');
    expect(paths).toContain('/b');
  });

  it('returns empty array for unknown tag', () => {
    const idx = createRouteTagIndex();
    expect(idx.getRoutesByTag('nonexistent')).toEqual([]);
  });

  it('getAllTags returns all unique tags', () => {
    const idx = createRouteTagIndex();
    idx.addTags('GET', '/x', ['alpha', 'beta']);
    idx.addTags('GET', '/y', ['beta', 'gamma']);
    const all = idx.getAllTags();
    expect(all).toEqual(expect.arrayContaining(['alpha', 'beta', 'gamma']));
    expect(all).toHaveLength(3);
  });

  it('clear removes all entries', () => {
    const idx = createRouteTagIndex();
    idx.addTags('GET', '/z', ['tag1']);
    idx.clear();
    expect(idx.size()).toBe(0);
    expect(idx.getAllTags()).toEqual([]);
  });

  it('size reflects number of tagged routes', () => {
    const idx = createRouteTagIndex();
    idx.addTags('GET', '/p', ['x']);
    idx.addTags('POST', '/q', ['y']);
    expect(idx.size()).toBe(2);
  });
});
