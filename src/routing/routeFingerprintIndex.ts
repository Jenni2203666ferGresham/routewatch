import { RouteFingerprint, RouteFingerprintTracker } from './routeFingerprintTracker';

export interface FingerprintChangeEvent {
  method: string;
  route: string;
  previousFingerprint: string;
  currentFingerprint: string;
  detectedAt: number;
}

export interface RouteFingerprintIndex {
  sync(tracker: RouteFingerprintTracker): FingerprintChangeEvent[];
  getChanges(): FingerprintChangeEvent[];
  getSnapshot(): Map<string, string>;
  clear(): void;
}

function makeKey(method: string, route: string): string {
  return `${method.toUpperCase()}:${route}`;
}

export function createRouteFingerprintIndex(): RouteFingerprintIndex {
  const snapshot = new Map<string, string>();
  const changes: FingerprintChangeEvent[] = [];

  function sync(tracker: RouteFingerprintTracker): FingerprintChangeEvent[] {
    const current = tracker.getAll();
    const detected: FingerprintChangeEvent[] = [];

    for (const entry of current) {
      const key = makeKey(entry.method, entry.route);
      const prev = snapshot.get(key);
      if (prev !== undefined && prev !== entry.fingerprint) {
        const event: FingerprintChangeEvent = {
          method: entry.method,
          route: entry.route,
          previousFingerprint: prev,
          currentFingerprint: entry.fingerprint,
          detectedAt: Date.now(),
        };
        detected.push(event);
        changes.push(event);
      }
      snapshot.set(key, entry.fingerprint);
    }

    return detected;
  }

  function getChanges(): FingerprintChangeEvent[] {
    return [...changes];
  }

  function getSnapshot(): Map<string, string> {
    return new Map(snapshot);
  }

  function clear(): void {
    snapshot.clear();
    changes.length = 0;
  }

  return { sync, getChanges, getSnapshot, clear };
}
