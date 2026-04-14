import { createRouteTagger, RouteTagger } from './routeTagger';

describe('createRouteTagger', () => {
  let tagger: RouteTagger;

  beforeEach(() => {
    tagger = createRouteTagger();
  });

  it('starts with no tags for an unknown route', () => {
    expect(tagger.getTags('/api/users')).toEqual([]);
  });

  it('adds a tag to a route', () => {
    tagger.addTag('/api/users', { key: 'team', value: 'platform' });
    expect(tagger.getTags('/api/users')).toEqual([{ key: 'team', value: 'platform' }]);
  });

  it('overwrites a tag with the same key', () => {
    tagger.addTag('/api/users', { key: 'team', value: 'platform' });
    tagger.addTag('/api/users', { key: 'team', value: 'infra' });
    expect(tagger.getTags('/api/users')).toHaveLength(1);
    expect(tagger.getTagValue('/api/users', 'team')).toBe('infra');
  });

  it('removes a tag by key', () => {
    tagger.addTag('/api/users', { key: 'team', value: 'platform' });
    tagger.addTag('/api/users', { key: 'env', value: 'prod' });
    tagger.removeTag('/api/users', 'team');
    expect(tagger.getTags('/api/users')).toEqual([{ key: 'env', value: 'prod' }]);
  });

  it('removeTag is a no-op for unknown route', () => {
    expect(() => tagger.removeTag('/unknown', 'key')).not.toThrow();
  });

  it('getTagValue returns undefined for missing key', () => {
    tagger.addTag('/api/users', { key: 'env', value: 'prod' });
    expect(tagger.getTagValue('/api/users', 'missing')).toBeUndefined();
  });

  it('getRoutesWithTag finds routes by key', () => {
    tagger.addTag('/api/users', { key: 'team', value: 'platform' });
    tagger.addTag('/api/orders', { key: 'team', value: 'commerce' });
    tagger.addTag('/health', { key: 'env', value: 'prod' });
    const routes = tagger.getRoutesWithTag('team');
    expect(routes).toContain('/api/users');
    expect(routes).toContain('/api/orders');
    expect(routes).not.toContain('/health');
  });

  it('getRoutesWithTag filters by value when provided', () => {
    tagger.addTag('/api/users', { key: 'team', value: 'platform' });
    tagger.addTag('/api/orders', { key: 'team', value: 'commerce' });
    const routes = tagger.getRoutesWithTag('team', 'platform');
    expect(routes).toEqual(['/api/users']);
  });

  it('getAllTags returns a copy of all tags', () => {
    tagger.addTag('/api/users', { key: 'env', value: 'prod' });
    const all = tagger.getAllTags();
    expect(all['/api/users']).toEqual([{ key: 'env', value: 'prod' }]);
    // ensure it is a copy
    all['/api/users'].push({ key: 'mutated', value: 'true' });
    expect(tagger.getTags('/api/users')).toHaveLength(1);
  });

  it('clear removes tags for a specific route', () => {
    tagger.addTag('/api/users', { key: 'env', value: 'prod' });
    tagger.addTag('/api/orders', { key: 'env', value: 'prod' });
    tagger.clear('/api/users');
    expect(tagger.getTags('/api/users')).toEqual([]);
    expect(tagger.getTags('/api/orders')).toHaveLength(1);
  });

  it('clear with no argument removes all tags', () => {
    tagger.addTag('/api/users', { key: 'env', value: 'prod' });
    tagger.addTag('/api/orders', { key: 'env', value: 'prod' });
    tagger.clear();
    expect(tagger.getAllTags()).toEqual({});
  });

  it('initialises with tags from config', () => {
    const pre = createRouteTagger({
      tags: { '/api/v1': [{ key: 'version', value: 'v1' }] },
    });
    expect(pre.getTagValue('/api/v1', 'version')).toBe('v1');
  });
});
