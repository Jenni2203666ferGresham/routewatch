import { createRouteRateSampler } from './routeRateSampler';

describe('createRouteRateSampler', () => {
  it('returns null for unknown route', () => {
    const sampler = createRouteRateSampler();
    expect(sampler.getSample('/unknown', 'GET')).toBeNull();
  });

  it('records requests and computes rps', () => {
    const sampler = createRouteRateSampler({ windowMs: 60_000 });
    for (let i = 0; i < 30; i++) sampler.record('/api/users', 'GET');
    const sample = sampler.getSample('/api/users', 'GET');
    expect(sample).not.toBeNull();
    expect(sample!.totalRequests).toBe(30);
    // 30 reqs / 60 s = 0.5 rps
    expect(sample!.requestsPerSecond).toBe(0.5);
    expect(sample!.windowMs).toBe(60_000);
  });

  it('getAllSamples returns all tracked routes', () => {
    const sampler = createRouteRateSampler();
    sampler.record('/a', 'GET');
    sampler.record('/b', 'POST');
    sampler.record('/a', 'GET');
    const all = sampler.getAllSamples();
    expect(all.length).toBe(2);
    const routes = all.map((s) => s.route);
    expect(routes).toContain('/a');
    expect(routes).toContain('/b');
  });

  it('prunes entries outside the window', () => {
    jest.useFakeTimers();
    const sampler = createRouteRateSampler({ windowMs: 1_000 });
    sampler.record('/api/data', 'GET');
    sampler.record('/api/data', 'GET');
    // advance past window
    jest.advanceTimersByTime(2_000);
    sampler.record('/api/data', 'GET'); // one fresh entry
    const sample = sampler.getSample('/api/data', 'GET');
    expect(sample!.totalRequests).toBe(1);
    jest.useRealTimers();
  });

  it('reset clears all data', () => {
    const sampler = createRouteRateSampler();
    sampler.record('/x', 'DELETE');
    sampler.reset();
    expect(sampler.getAllSamples().length).toBe(0);
    expect(sampler.getSample('/x', 'DELETE')).toBeNull();
  });

  it('is case-insensitive for method', () => {
    const sampler = createRouteRateSampler();
    sampler.record('/api/items', 'get');
    sampler.record('/api/items', 'GET');
    const sample = sampler.getSample('/api/items', 'get');
    expect(sample!.totalRequests).toBe(2);
  });
});
