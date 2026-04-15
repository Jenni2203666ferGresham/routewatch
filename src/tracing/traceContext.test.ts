import {
  createTraceContextStore,
  startTrace,
  finishTrace,
  getActiveTraces,
  getCompletedTraces,
  findTraceByTraceId,
} from './traceContext';

function makeCtx(overrides: Partial<Parameters<typeof startTrace>[1]> = {}) {
  return {
    traceId: 'trace-1',
    spanId: 'span-1',
    route: '/api/users',
    method: 'GET',
    tags: {},
    ...overrides,
  };
}

describe('traceContext', () => {
  it('starts a trace and marks it active', () => {
    const store = createTraceContextStore();
    startTrace(store, makeCtx());
    expect(getActiveTraces(store)).toHaveLength(1);
    expect(getActiveTraces(store)[0].route).toBe('/api/users');
  });

  it('finishes a trace and moves it to completed', () => {
    const store = createTraceContextStore();
    startTrace(store, makeCtx());
    const finished = finishTrace(store, 'span-1');
    expect(finished).toBeDefined();
    expect(getActiveTraces(store)).toHaveLength(0);
    expect(getCompletedTraces(store)).toHaveLength(1);
  });

  it('returns undefined when finishing unknown span', () => {
    const store = createTraceContextStore();
    expect(finishTrace(store, 'nonexistent')).toBeUndefined();
  });

  it('respects maxCompleted limit', () => {
    const store = createTraceContextStore(3);
    for (let i = 0; i < 5; i++) {
      startTrace(store, makeCtx({ spanId: `span-${i}`, traceId: 'trace-x' }));
      finishTrace(store, `span-${i}`);
    }
    expect(getCompletedTraces(store)).toHaveLength(3);
  });

  it('finds completed traces by traceId', () => {
    const store = createTraceContextStore();
    startTrace(store, makeCtx({ traceId: 'trace-A', spanId: 's1' }));
    startTrace(store, makeCtx({ traceId: 'trace-B', spanId: 's2' }));
    finishTrace(store, 's1');
    finishTrace(store, 's2');
    const results = findTraceByTraceId(store, 'trace-A');
    expect(results).toHaveLength(1);
    expect(results[0].traceId).toBe('trace-A');
  });

  it('stores tags on the trace', () => {
    const store = createTraceContextStore();
    startTrace(store, makeCtx({ tags: { env: 'production' } }));
    finishTrace(store, 'span-1');
    expect(getCompletedTraces(store)[0].tags).toEqual({ env: 'production' });
  });
});
