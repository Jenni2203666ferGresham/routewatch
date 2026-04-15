export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  route: string;
  method: string;
  startedAt: number;
  tags: Record<string, string>;
}

export interface TraceContextStore {
  active: Map<string, TraceContext>;
  completed: TraceContext[];
  maxCompleted: number;
}

export function createTraceContextStore(maxCompleted = 500): TraceContextStore {
  return {
    active: new Map(),
    completed: [],
    maxCompleted,
  };
}

export function startTrace(
  store: TraceContextStore,
  ctx: Omit<TraceContext, 'startedAt'>
): TraceContext {
  const trace: TraceContext = { ...ctx, startedAt: Date.now() };
  store.active.set(ctx.spanId, trace);
  return trace;
}

export function finishTrace(
  store: TraceContextStore,
  spanId: string
): TraceContext | undefined {
  const trace = store.active.get(spanId);
  if (!trace) return undefined;
  store.active.delete(spanId);
  store.completed.push(trace);
  if (store.completed.length > store.maxCompleted) {
    store.completed.shift();
  }
  return trace;
}

export function getActiveTraces(store: TraceContextStore): TraceContext[] {
  return Array.from(store.active.values());
}

export function getCompletedTraces(store: TraceContextStore): TraceContext[] {
  return [...store.completed];
}

export function findTraceByTraceId(
  store: TraceContextStore,
  traceId: string
): TraceContext[] {
  return store.completed.filter((t) => t.traceId === traceId);
}
