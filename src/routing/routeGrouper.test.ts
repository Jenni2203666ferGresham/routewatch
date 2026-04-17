import { groupRoutes, extractPrefix, createRouteGrouper } from './routeGrouper';

describe('extractPrefix', () => {
  it('extracts single segment prefix', () => {
    expect(extractPrefix('/api/users/123', 1)).toBe('/api');
  });

  it('extracts two segment prefix', () => {
    expect(extractPrefix('/api/users/123', 2)).toBe('/api/users');
  });

  it('handles root route', () => {
    expect(extractPrefix('/', 1)).toBe('/');
  });

  it('handles short route', () => {
    expect(extractPrefix('/api', 2)).toBe('/api');
  });
});

describe('groupRoutes', () => {
  const routes = [
    '/api/users',
    '/api/users/:id',
    '/api/posts',
    '/api/posts/:id',
    '/health',
  ];

  it('groups by single segment by default', () => {
    const groups = groupRoutes(routes);
    const api = groups.find(g => g.prefix === '/api');
    expect(api).toBeDefined();
    expect(api!.count).toBe(4);
  });

  it('groups by two segments', () => {
    const groups = groupRoutes(routes, { depth: 2 });
    const users = groups.find(g => g.prefix === '/api/users');
    expect(users).toBeDefined();
    expect(users!.count).toBe(2);
  });

  it('sorts groups by count descending', () => {
    const groups = groupRoutes(routes);
    expect(groups[0].count).toBeGreaterThanOrEqual(groups[1].count);
  });

  it('includes all routes in groups', () => {
    const groups = groupRoutes(routes);
    const total = groups.reduce((s, g) => s + g.count, 0);
    expect(total).toBe(routes.length);
  });
});

describe('createRouteGrouper', () => {
  it('groups using configured depth', () => {
    const grouper = createRouteGrouper({ depth: 2 });
    const groups = grouper.group(['/api/users', '/api/users/:id', '/api/posts']);
    const users = groups.find(g => g.prefix === '/api/users');
    expect(users!.count).toBe(2);
  });

  it('topGroups returns limited results', () => {
    const grouper = createRouteGrouper();
    const routes = ['/a/1', '/a/2', '/b/1', '/c/1'];
    const top = grouper.topGroups(routes, 1);
    expect(top).toHaveLength(1);
    expect(top[0].prefix).toBe('/a');
  });
});
