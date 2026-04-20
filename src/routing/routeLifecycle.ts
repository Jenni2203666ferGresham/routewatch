export type LifecycleEvent = 'registered' | 'activated' | 'deprecated' | 'removed';

export interface LifecycleEntry {
  route: string;
  method: string;
  event: LifecycleEvent;
  timestamp: number;
  meta?: Record<string, unknown>;
}

export interface RouteLifecycle {
  transition(route: string, method: string, event: LifecycleEvent, meta?: Record<string, unknown>): void;
  getHistory(route: string, method: string): LifecycleEntry[];
  getAll(): LifecycleEntry[];
  getCurrentState(route: string, method: string): LifecycleEvent | undefined;
  getByEvent(event: LifecycleEvent): LifecycleEntry[];
  clear(): void;
}

function makeKey(route: string, method: string): string {
  return `${method.toUpperCase()}:${route}`;
}

const VALID_TRANSITIONS: Record<LifecycleEvent, LifecycleEvent[]> = {
  registered: ['activated', 'removed'],
  activated: ['deprecated', 'removed'],
  deprecated: ['activated', 'removed'],
  removed: [],
};

export function createRouteLifecycle(): RouteLifecycle {
  const history: LifecycleEntry[] = [];
  const states = new Map<string, LifecycleEvent>();

  function transition(
    route: string,
    method: string,
    event: LifecycleEvent,
    meta?: Record<string, unknown>
  ): void {
    const key = makeKey(route, method);
    const current = states.get(key);

    if (current !== undefined) {
      const allowed = VALID_TRANSITIONS[current];
      if (!allowed.includes(event)) {
        throw new Error(
          `Invalid lifecycle transition for ${key}: ${current} -> ${event}`
        );
      }
    }

    const entry: LifecycleEntry = {
      route,
      method: method.toUpperCase(),
      event,
      timestamp: Date.now(),
      meta,
    };

    history.push(entry);
    states.set(key, event);
  }

  function getHistory(route: string, method: string): LifecycleEntry[] {
    const key = makeKey(route, method);
    return history.filter(
      (e) => makeKey(e.route, e.method) === key
    );
  }

  function getAll(): LifecycleEntry[] {
    return [...history];
  }

  function getCurrentState(route: string, method: string): LifecycleEvent | undefined {
    return states.get(makeKey(route, method));
  }

  function getByEvent(event: LifecycleEvent): LifecycleEntry[] {
    const activeKeys = new Set<string>();
    for (const [key, state] of states.entries()) {
      if (state === event) activeKeys.add(key);
    }
    return history.filter(
      (e) => activeKeys.has(makeKey(e.route, e.method)) && e.event === event
    );
  }

  function clear(): void {
    history.length = 0;
    states.clear();
  }

  return { transition, getHistory, getAll, getCurrentState, getByEvent, clear };
}
