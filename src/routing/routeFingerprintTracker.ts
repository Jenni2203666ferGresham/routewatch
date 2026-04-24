export interface RouteFingerprint {
  method: string;
  route: string;
  fingerprint: string;
  firstSeen: number;
  lastSeen: number;
  hitCount: number;
}

export interface RouteFingerprintTracker {
  record(method: string, route: string, fingerprint: string): void;
  getAll(): RouteFingerprint[];
  getByFingerprint(fingerprint: string): RouteFingerprint | undefined;
  getByRoute(method: string, route: string): RouteFingerprint | undefined;
  hasChanged(method: string, route: string, fingerprint: string): boolean;
  reset(): void;
}

function makeKey(method: string, route: string): string {
  return `${method.toUpperCase()}:${route}`;
}

export function createRouteFingerprintTracker(): RouteFingerprintTracker {
  const store = new Map<string, RouteFingerprint>();
  const byFingerprint = new Map<string, string>();

  function record(method: string, route: string, fingerprint: string): void {
    const key = makeKey(method, route);
    const now = Date.now();
    const existing = store.get(key);
    if (existing) {
      existing.fingerprint = fingerprint;
      existing.lastSeen = now;
      existing.hitCount += 1;
    } else {
      const entry: RouteFingerprint = {
        method: method.toUpperCase(),
        route,
        fingerprint,
        firstSeen: now,
        lastSeen: now,
        hitCount: 1,
      };
      store.set(key, entry);
    }
    byFingerprint.set(fingerprint, key);
  }

  function getAll(): RouteFingerprint[] {
    return Array.from(store.values());
  }

  function getByFingerprint(fingerprint: string): RouteFingerprint | undefined {
    const key = byFingerprint.get(fingerprint);
    return key ? store.get(key) : undefined;
  }

  function getByRoute(method: string, route: string): RouteFingerprint | undefined {
    return store.get(makeKey(method, route));
  }

  function hasChanged(method: string, route: string, fingerprint: string): boolean {
    const entry = getByRoute(method, route);
    if (!entry) return false;
    return entry.fingerprint !== fingerprint;
  }

  function reset(): void {
    store.clear();
    byFingerprint.clear();
  }

  return { record, getAll, getByFingerprint, getByRoute, hasChanged, reset };
}
