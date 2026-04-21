export interface RouteErrorEntry {
  route: string;
  method: string;
  statusCode: number;
  message: string;
  timestamp: number;
  traceId?: string;
}

export interface RouteErrorLog {
  record(entry: RouteErrorEntry): void;
  getAll(): RouteErrorEntry[];
  getByRoute(route: string): RouteErrorEntry[];
  getByMethod(method: string): RouteErrorEntry[];
  getByStatusCode(code: number): RouteErrorEntry[];
  getSince(since: number): RouteErrorEntry[];
  clear(): void;
  size(): number;
}

export function createRouteErrorLog(maxEntries = 1000): RouteErrorLog {
  const entries: RouteErrorEntry[] = [];

  function record(entry: RouteErrorEntry): void {
    entries.push({ ...entry });
    if (entries.length > maxEntries) {
      entries.shift();
    }
  }

  function getAll(): RouteErrorEntry[] {
    return [...entries];
  }

  function getByRoute(route: string): RouteErrorEntry[] {
    return entries.filter((e) => e.route === route);
  }

  function getByMethod(method: string): RouteErrorEntry[] {
    const upper = method.toUpperCase();
    return entries.filter((e) => e.method.toUpperCase() === upper);
  }

  function getByStatusCode(code: number): RouteErrorEntry[] {
    return entries.filter((e) => e.statusCode === code);
  }

  function getSince(since: number): RouteErrorEntry[] {
    return entries.filter((e) => e.timestamp >= since);
  }

  function clear(): void {
    entries.length = 0;
  }

  function size(): number {
    return entries.length;
  }

  return { record, getAll, getByRoute, getByMethod, getByStatusCode, getSince, clear, size };
}
