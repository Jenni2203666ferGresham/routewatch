import { createRouteMatcher } from './routeMatcher';

describe('createRouteMatcher', () => {
  it('matches an exact path', () => {
    const matcher = createRouteMatcher();
    matcher.addPattern('GET /users');
    const result = matcher.match('GET', '/users');
    expect(result.matched).toBe(true);
    expect(result.pattern).toBe('GET /users');
    expect(result.params).toEqual({});
  });

  it('matches a path with params', () => {
    const matcher = createRouteMatcher();
    matcher.addPattern('GET /users/:id');
    const result = matcher.match('GET', '/users/42');
    expect(result.matched).toBe(true);
    expect(result.params).toEqual({ id: '42' });
  });

  it('does not match wrong method', () => {
    const matcher = createRouteMatcher();
    matcher.addPattern('POST /users');
    const result = matcher.match('GET', '/users');
    expect(result.matched).toBe(false);
  });

  it('matches wildcard method', () => {
    const matcher = createRouteMatcher();
    matcher.addPattern('/health');
    const result = matcher.match('GET', '/health');
    expect(result.matched).toBe(true);
  });

  it('returns no match when no patterns registered', () => {
    const matcher = createRouteMatcher();
    const result = matcher.match('GET', '/anything');
    expect(result.matched).toBe(false);
    expect(result.pattern).toBeNull();
  });

  it('removes a pattern', () => {
    const matcher = createRouteMatcher();
    matcher.addPattern('DELETE /items/:id');
    matcher.removePattern('DELETE /items/:id');
    const result = matcher.match('DELETE', '/items/5');
    expect(result.matched).toBe(false);
  });

  it('lists all patterns', () => {
    const matcher = createRouteMatcher();
    matcher.addPattern('GET /a');
    matcher.addPattern('POST /b');
    expect(matcher.listPatterns()).toEqual(expect.arrayContaining(['GET /a', 'POST /b']));
    expect(matcher.listPatterns()).toHaveLength(2);
  });

  it('matches multiple params', () => {
    const matcher = createRouteMatcher();
    matcher.addPattern('GET /orgs/:org/repos/:repo');
    const result = matcher.match('GET', '/orgs/acme/repos/widget');
    expect(result.matched).toBe(true);
    expect(result.params).toEqual({ org: 'acme', repo: 'widget' });
  });
});
