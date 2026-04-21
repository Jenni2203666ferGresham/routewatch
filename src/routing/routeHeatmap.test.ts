import { createRouteHeatmap } from './routeHeatmap';

describe('createRouteHeatmap', () => {
  it('records hits and retrieves entry', () => {
    const hm = createRouteHeatmap();
    hm.record('/api/users', 'GET');
    hm.record('/api/users', 'GET');
    const entry = hm.getEntry('/api/users', 'GET');
    expect(entry).toBeDefined();
    expect(entry!.hits.reduce((a, b) => a + b, 0)).toBe(2);
  });

  it('normalises method to uppercase', () => {
    const hm = createRouteHeatmap();
    hm.record('/ping', 'get');
    const entry = hm.getEntry('/ping', 'get');
    expect(entry?.method).toBe('GET');
  });

  it('returns undefined for unknown route', () => {
    const hm = createRouteHeatmap();
    expect(hm.getEntry('/unknown', 'GET')).toBeUndefined();
  });

  it('getAll returns all entries', () => {
    const hm = createRouteHeatmap();
    hm.record('/a', 'GET');
    hm.record('/b', 'POST');
    expect(hm.getAll()).toHaveLength(2);
  });

  it('getHotRoutes filters by threshold', () => {
    const hm = createRouteHeatmap();
    for (let i = 0; i < 5; i++) hm.record('/hot', 'GET');
    hm.record('/cold', 'GET');
    const hot = hm.getHotRoutes(5);
    expect(hot).toHaveLength(1);
    expect(hot[0].route).toBe('/hot');
  });

  it('reset clears all entries', () => {
    const hm = createRouteHeatmap();
    hm.record('/api', 'GET');
    hm.reset();
    expect(hm.getAll()).toHaveLength(0);
  });

  it('distributes hits across buckets based on timestamp', () => {
    const bucketSizeMs = 1000;
    const bucketCount = 10;
    const hm = createRouteHeatmap(bucketSizeMs, bucketCount);
    const entry = hm.getEntry('/x', 'GET') ?? (() => { hm.record('/x', 'GET', Date.now()); return hm.getEntry('/x', 'GET')!; })();
    // record in bucket 0
    hm.record('/x', 'GET', entry.createdAt);
    // record in bucket 1
    hm.record('/x', 'GET', entry.createdAt + bucketSizeMs);
    const e = hm.getEntry('/x', 'GET')!;
    expect(e.hits[0]).toBeGreaterThanOrEqual(1);
    expect(e.hits[1]).toBeGreaterThanOrEqual(1);
  });
});
