import { createRouteAliasMap } from './routeAliasMap';

describe('createRouteAliasMap', () => {
  it('resolves a known alias to its target', () => {
    const m = createRouteAliasMap();
    m.addAlias('/old', '/new');
    expect(m.resolve('/old')).toBe('/new');
  });

  it('returns the original route when no alias exists', () => {
    const m = createRouteAliasMap();
    expect(m.resolve('/unknown')).toBe('/unknown');
  });

  it('hasAlias returns true after adding', () => {
    const m = createRouteAliasMap();
    m.addAlias('/a', '/b');
    expect(m.hasAlias('/a')).toBe(true);
    expect(m.hasAlias('/b')).toBe(false);
  });

  it('removeAlias deletes the alias', () => {
    const m = createRouteAliasMap();
    m.addAlias('/a', '/b');
    expect(m.removeAlias('/a')).toBe(true);
    expect(m.hasAlias('/a')).toBe(false);
    expect(m.resolve('/a')).toBe('/a');
  });

  it('removeAlias returns false for unknown alias', () => {
    const m = createRouteAliasMap();
    expect(m.removeAlias('/nope')).toBe(false);
  });

  it('getAll returns all aliases', () => {
    const m = createRouteAliasMap();
    m.addAlias('/x', '/y');
    m.addAlias('/p', '/q');
    const all = m.getAll();
    expect(all).toHaveLength(2);
    expect(all).toContainEqual({ alias: '/x', target: '/y' });
    expect(all).toContainEqual({ alias: '/p', target: '/q' });
  });

  it('clear removes all aliases', () => {
    const m = createRouteAliasMap();
    m.addAlias('/a', '/b');
    m.clear();
    expect(m.getAll()).toHaveLength(0);
  });

  it('throws when alias or target is empty', () => {
    const m = createRouteAliasMap();
    expect(() => m.addAlias('', '/b')).toThrow();
    expect(() => m.addAlias('/a', '')).toThrow();
  });

  it('overwrites existing alias', () => {
    const m = createRouteAliasMap();
    m.addAlias('/a', '/b');
    m.addAlias('/a', '/c');
    expect(m.resolve('/a')).toBe('/c');
  });
});
