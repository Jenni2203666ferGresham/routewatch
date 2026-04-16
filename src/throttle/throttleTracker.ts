export interface ThrottleStats {
  route: string;
  active: number;
  queued: number;
  rejected: number;
  completed: number;
}

export interface ThrottleTracker {
  acquire(route: string): boolean;
  release(route: string): void;
  reject(route: string): void;
  getStats(route: string): ThrottleStats;
  getAllStats(): ThrottleStats[];
  reset(): void;
  resetRoute(route: string): void;
}

interface RouteState {
  active: number;
  queued: number;
  rejected: number;
  completed: number;
}

export function createThrottleTracker(): ThrottleTracker {
  const state = new Map<string, RouteState>();

  function ensure(route: string): RouteState {
    if (!state.has(route)) {
      state.set(route, { active: 0, queued: 0, rejected: 0, completed: 0 });
    }
    return state.get(route)!;
  }

  return {
    acquire(route) {
      const s = ensure(route);
      s.active++;
      return true;
    },
    release(route) {
      const s = ensure(route);
      if (s.active > 0) s.active--;
      s.completed++;
    },
    reject(route) {
      const s = ensure(route);
      s.rejected++;
    },
    getStats(route) {
      const s = ensure(route);
      return { route, ...s };
    },
    getAllStats() {
      return Array.from(state.entries()).map(([route, s]) => ({ route, ...s }));
    },
    reset() {
      state.clear();
    },
    /** Resets stats for a single route without affecting others. */
    resetRoute(route) {
      state.delete(route);
    },
  };
}
