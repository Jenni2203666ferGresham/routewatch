export interface RouteChangeEvent {
  timestamp: number;
  action: 'registered' | 'unregistered' | 'deprecated' | 'undeprecated' | 'aliased';
  route: string;
  method: string;
  meta?: Record<string, unknown>;
}

export interface RouteChangeLog {
  record(event: Omit<RouteChangeEvent, 'timestamp'>): void;
  getAll(): RouteChangeEvent[];
  getByRoute(route: string): RouteChangeEvent[];
  getByAction(action: RouteChangeEvent['action']): RouteChangeEvent[];
  since(timestamp: number): RouteChangeEvent[];
  clear(): void;
  size(): number;
}

export function createRouteChangeLog(maxEntries = 500): RouteChangeLog {
  const entries: RouteChangeEvent[] = [];

  function record(event: Omit<RouteChangeEvent, 'timestamp'>): void {
    const entry: RouteChangeEvent = { ...event, timestamp: Date.now() };
    entries.push(entry);
    if (entries.length > maxEntries) {
      entries.splice(0, entries.length - maxEntries);
    }
  }

  function getAll(): RouteChangeEvent[] {
    return [...entries];
  }

  function getByRoute(route: string): RouteChangeEvent[] {
    return entries.filter((e) => e.route === route);
  }

  function getByAction(action: RouteChangeEvent['action']): RouteChangeEvent[] {
    return entries.filter((e) => e.action === action);
  }

  function since(timestamp: number): RouteChangeEvent[] {
    return entries.filter((e) => e.timestamp >= timestamp);
  }

  function clear(): void {
    entries.length = 0;
  }

  function size(): number {
    return entries.length;
  }

  return { record, getAll, getByRoute, getByAction, since, clear, size };
}
