export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeout: number; // ms before half-open retry
}

export interface CircuitBreakerStats {
  route: string;
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureAt: number | null;
  trippedAt: number | null;
}

export interface CircuitBreaker {
  record(route: string, success: boolean): void;
  getState(route: string): CircuitState;
  getStats(route: string): CircuitBreakerStats;
  getAllStats(): CircuitBreakerStats[];
  reset(route: string): void;
}

function defaultStats(route: string): CircuitBreakerStats {
  return { route, state: 'closed', failures: 0, successes: 0, lastFailureAt: null, trippedAt: null };
}

export function createCircuitBreaker(config: CircuitBreakerConfig): CircuitBreaker {
  const map = new Map<string, CircuitBreakerStats>();

  function ensure(route: string): CircuitBreakerStats {
    if (!map.has(route)) map.set(route, defaultStats(route));
    return map.get(route)!;
  }

  function resolveState(stats: CircuitBreakerStats): CircuitState {
    if (stats.state === 'open' && stats.trippedAt !== null) {
      if (Date.now() - stats.trippedAt >= config.timeout) {
        stats.state = 'half-open';
        stats.successes = 0;
      }
    }
    return stats.state;
  }

  return {
    record(route, success) {
      const stats = ensure(route);
      resolveState(stats);

      if (success) {
        stats.successes++;
        stats.failures = 0;
        if (stats.state === 'half-open' && stats.successes >= config.successThreshold) {
          stats.state = 'closed';
          stats.trippedAt = null;
        }
      } else {
        stats.failures++;
        stats.lastFailureAt = Date.now();
        if (stats.state !== 'open' && stats.failures >= config.failureThreshold) {
          stats.state = 'open';
          stats.trippedAt = Date.now();
        }
      }
    },

    getState(route) {
      const stats = ensure(route);
      return resolveState(stats);
    },

    getStats(route) {
      const stats = ensure(route);
      resolveState(stats);
      return { ...stats };
    },

    getAllStats() {
      return Array.from(map.values()).map(s => { resolveState(s); return { ...s }; });
    },

    reset(route) {
      map.set(route, defaultStats(route));
    },
  };
}
