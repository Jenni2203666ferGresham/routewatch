import { createRouteMetadataStore } from './routeMetadataStore';

describe('createRouteMetadataStore', () => {
  it('stores and retrieves metadata for a route', () => {
    const store = createRouteMetadataStore();
    store.set('/users', 'GET', { description: 'List users', tags: ['users'] });
    const meta = store.get('/users', 'GET');
    expect(meta).toBeDefined();
    expect(meta?.description).toBe('List users');
    expect(meta?.tags).toEqual(['users']);
    expect(meta?.deprecated).toBe(false);
  });

  it('normalises method to uppercase', () => {
    const store = createRouteMetadataStore();
    store.set('/ping', 'get', {});
    const meta = store.get('/ping', 'get');
    expect(meta?.method).toBe('GET');
  });

  it('preserves addedAt on subsequent updates', () => {
    const store = createRouteMetadataStore();
    store.set('/items', 'POST', { description: 'Create item' });
    const first = store.get('/items', 'POST')!;
    store.set('/items', 'POST', { description: 'Create item v2' });
    const second = store.get('/items', 'POST')!;
    expect(second.addedAt).toBe(first.addedAt);
    expect(second.description).toBe('Create item v2');
  });

  it('updates updatedAt on change', async () => {
    const store = createRouteMetadataStore();
    store.set('/x', 'DELETE', {});
    const before = store.get('/x', 'DELETE')!.updatedAt;
    await new Promise((r) => setTimeout(r, 5));
    store.set('/x', 'DELETE', { description: 'changed' });
    const after = store.get('/x', 'DELETE')!.updatedAt;
    expect(after).toBeGreaterThanOrEqual(before);
  });

  it('getAll returns all entries', () => {
    const store = createRouteMetadataStore();
    store.set('/a', 'GET', {});
    store.set('/b', 'POST', {});
    expect(store.getAll()).toHaveLength(2);
  });

  it('getByTag filters correctly', () => {
    const store = createRouteMetadataStore();
    store.set('/admin', 'GET', { tags: ['admin', 'read'] });
    store.set('/public', 'GET', { tags: ['read'] });
    store.set('/write', 'POST', { tags: ['write'] });
    expect(store.getByTag('read')).toHaveLength(2);
    expect(store.getByTag('admin')).toHaveLength(1);
    expect(store.getByTag('unknown')).toHaveLength(0);
  });

  it('delete removes an entry', () => {
    const store = createRouteMetadataStore();
    store.set('/del', 'GET', {});
    expect(store.delete('/del', 'GET')).toBe(true);
    expect(store.get('/del', 'GET')).toBeUndefined();
    expect(store.delete('/del', 'GET')).toBe(false);
  });

  it('clear empties the store', () => {
    const store = createRouteMetadataStore();
    store.set('/a', 'GET', {});
    store.set('/b', 'GET', {});
    store.clear();
    expect(store.size()).toBe(0);
  });

  it('supports custom metadata fields', () => {
    const store = createRouteMetadataStore();
    store.set('/custom', 'GET', { custom: { owner: 'team-a', sla: 200 } });
    const meta = store.get('/custom', 'GET')!;
    expect(meta.custom?.['owner']).toBe('team-a');
  });
});
