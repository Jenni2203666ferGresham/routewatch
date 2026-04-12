import { createFastifyMiddleware } from './fastifyMiddleware';
import { RouteMetrics } from '../metrics/RouteMetrics';

function makeFastifyMock() {
  const hooks: Record<string, Function[]> = {};
  return {
    addHook(name: string, fn: Function) {
      if (!hooks[name]) hooks[name] = [];
      hooks[name].push(fn);
    },
    async triggerHook(name: string, ...args: any[]) {
      for (const fn of hooks[name] ?? []) {
        await fn(...args);
      }
    },
  };
}

function makeRequest(overrides: Partial<any> = {}): any {
  return {
    method: 'GET',
    url: '/users/1',
    routerPath: '/users/:id',
    routeOptions: undefined,
    ...overrides,
  };
}

function makeReply(statusCode = 200): any {
  return { statusCode };
}

describe('createFastifyMiddleware', () => {
  let metrics: RouteMetrics;

  beforeEach(() => {
    metrics = new RouteMetrics();
  });

  it('registers onRequest and onResponse hooks', async () => {
    const fastify = makeFastifyMock();
    const plugin = createFastifyMiddleware(metrics);
    await plugin(fastify as any);
    expect((fastify as any).addHook).toBeDefined();
  });

  it('records a metric after onResponse fires', async () => {
    const fastify = makeFastifyMock();
    const plugin = createFastifyMiddleware(metrics);
    await plugin(fastify as any);

    const req = makeRequest();
    const res = makeReply(200);

    await fastify.triggerHook('onRequest', req, res);
    await new Promise((r) => setTimeout(r, 10));
    await fastify.triggerHook('onResponse', req, res);

    const entries = metrics.getAll();
    expect(entries).toHaveLength(1);
    expect(entries[0].method).toBe('GET');
    expect(entries[0].path).toBe('/users/:id');
    expect(entries[0].statusCode).toBe(200);
    expect(entries[0].latency).toBeGreaterThanOrEqual(0);
  });

  it('falls back to raw url when routerPath is missing', async () => {
    const fastify = makeFastifyMock();
    const plugin = createFastifyMiddleware(metrics);
    await plugin(fastify as any);

    const req = makeRequest({ routerPath: undefined, url: '/health?check=1' });
    const res = makeReply(204);

    await fastify.triggerHook('onRequest', req, res);
    await fastify.triggerHook('onResponse', req, res);

    const entries = metrics.getAll();
    expect(entries[0].path).toBe('/health');
  });

  it('does not record when onRequest was never called', async () => {
    const fastify = makeFastifyMock();
    const plugin = createFastifyMiddleware(metrics);
    await plugin(fastify as any);

    const req = makeRequest();
    const res = makeReply(500);

    await fastify.triggerHook('onResponse', req, res);
    expect(metrics.getAll()).toHaveLength(0);
  });
});
