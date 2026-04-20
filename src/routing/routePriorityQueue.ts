/**
 * routePriorityQueue.ts
 * Maintains a priority-ordered queue of routes based on a numeric score,
 * supporting insertion, removal, and ranked retrieval.
 */

export interface PriorityEntry {
  route: string;
  method: string;
  score: number;
}

export interface RoutePriorityQueue {
  insert(entry: PriorityEntry): void;
  remove(route: string, method: string): boolean;
  peek(): PriorityEntry | undefined;
  drain(): PriorityEntry[];
  topN(n: number): PriorityEntry[];
  size(): number;
  clear(): void;
}

function makeKey(route: string, method: string): string {
  return `${method.toUpperCase()}::${route}`;
}

export function createRoutePriorityQueue(): RoutePriorityQueue {
  // Descending order by score (highest priority first)
  const entries: PriorityEntry[] = [];
  const keySet = new Set<string>();

  function insert(entry: PriorityEntry): void {
    const key = makeKey(entry.route, entry.method);
    // Update in place if already present
    if (keySet.has(key)) {
      remove(entry.route, entry.method);
    }
    keySet.add(key);
    // Binary insertion to keep sorted descending
    let lo = 0;
    let hi = entries.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (entries[mid].score >= entry.score) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }
    entries.splice(lo, 0, entry);
  }

  function remove(route: string, method: string): boolean {
    const key = makeKey(route, method);
    if (!keySet.has(key)) return false;
    const idx = entries.findIndex(
      (e) => e.route === route && e.method.toUpperCase() === method.toUpperCase()
    );
    if (idx !== -1) entries.splice(idx, 1);
    keySet.delete(key);
    return true;
  }

  function peek(): PriorityEntry | undefined {
    return entries[0];
  }

  function drain(): PriorityEntry[] {
    const copy = [...entries];
    entries.length = 0;
    keySet.clear();
    return copy;
  }

  function topN(n: number): PriorityEntry[] {
    return entries.slice(0, Math.max(0, n));
  }

  function size(): number {
    return entries.length;
  }

  function clear(): void {
    entries.length = 0;
    keySet.clear();
  }

  return { insert, remove, peek, drain, topN, size, clear };
}
