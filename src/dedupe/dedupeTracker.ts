export interface DedupeEntry {
  route: string;
  method: string;
  statusCode: number;
  count: number;
  firstSeen: number;
  lastSeen: number;
}

export interface DedupeTracker {
  record(route: string, method: string, statusCode: number): void;
  getEntry(route: string, method: string, statusCode: number): DedupeEntry | undefined;
  getAll(): DedupeEntry[];
  reset(): void;
}

function makeKey(route: string, method: string, statusCode: number): string {
  return `${method.toUpperCase()}:${route}:${statusCode}`;
}

export function createDedupeTracker(): DedupeTracker {
  const entries = new Map<string, DedupeEntry>();

  function record(route: string, method: string, statusCode: number): void {
    const key = makeKey(route, method, statusCode);
    const now = Date.now();
    const existing = entries.get(key);
    if (existing) {
      existing.count += 1;
      existing.lastSeen = now;
    } else {
      entries.set(key, { route, method: method.toUpperCase(), statusCode, count: 1, firstSeen: now, lastSeen: now });
    }
  }

  function getEntry(route: string, method: string, statusCode: number): DedupeEntry | undefined {
    return entries.get(makeKey(route, method, statusCode));
  }

  function getAll(): DedupeEntry[] {
    return Array.from(entries.values());
  }

  function reset(): void {
    entries.clear();
  }

  return { record, getEntry, getAll, reset };
}
