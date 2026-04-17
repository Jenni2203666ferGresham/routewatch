import { createRouteRegistry } from './routeRegistry';
import { createRouteNormalizer } from './routeNormalizer';

export type RouteChangeEvent = {
  type: 'registered' | 'unregistered';
  method: string;
  path: string;
  normalizedPath: string;
  timestamp: number;
};

export type RouteWatcher = {
  watch: (method: string, path: string) => void;
  unwatch: (method: string, path: string) => void;
  getHistory: () => RouteChangeEvent[];
  onChange: (handler: (event: RouteChangeEvent) => void) => () => void;
  getActive: () => Array<{ method: string; path: string }>;
  reset: () => void;
};

export function createRouteWatcher(): RouteWatcher {
  const registry = createRouteRegistry();
  const normalizer = createRouteNormalizer();
  const history: RouteChangeEvent[] = [];
  const listeners = new Set<(event: RouteChangeEvent) => void>();

  function emit(event: RouteChangeEvent) {
    history.push(event);
    for (const handler of listeners) {
      handler(event);
    }
  }

  return {
    watch(method, path) {
      const normalizedPath = normalizer.normalize(path);
      registry.register(method, path);
      emit({ type: 'registered', method, path, normalizedPath, timestamp: Date.now() });
    },

    unwatch(method, path) {
      const normalizedPath = normalizer.normalize(path);
      registry.unregister(method, path);
      emit({ type: 'unregistered', method, path, normalizedPath, timestamp: Date.now() });
    },

    getHistory() {
      return [...history];
    },

    onChange(handler) {
      listeners.add(handler);
      return () => listeners.delete(handler);
    },

    getActive() {
      return registry.getAll().map(({ method, path }) => ({ method, path }));
    },

    reset() {
      history.length = 0;
      registry.clear();
    },
  };
}
