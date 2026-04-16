export interface RegisteredRoute {
  method: string;
  path: string;
  tags?: string[];
  addedAt: number;
}

export interface RouteRegistry {
  register(method: string, path: string, tags?: string[]): void;
  unregister(method: string, path: string): void;
  has(method: string, path: string): boolean;
  getAll(): RegisteredRoute[];
  getByTag(tag: string): RegisteredRoute[];
  clear(): void;
  size(): number;
}

function makeKey(method: string, path: string): string {
  return `${method.toUpperCase()}:${path}`;
}

export function createRouteRegistry(): RouteRegistry {
  const routes = new Map<string, RegisteredRoute>();

  function register(method: string, path: string, tags: string[] = []): void {
    const key = makeKey(method, path);
    if (!routes.has(key)) {
      routes.set(key, { method: method.toUpperCase(), path, tags, addedAt: Date.now() });
    }
  }

  function unregister(method: string, path: string): void {
    routes.delete(makeKey(method, path));
  }

  function has(method: string, path: string): boolean {
    return routes.has(makeKey(method, path));
  }

  function getAll(): RegisteredRoute[] {
    return Array.from(routes.values());
  }

  function getByTag(tag: string): RegisteredRoute[] {
    return getAll().filter(r => r.tags?.includes(tag));
  }

  function clear(): void {
    routes.clear();
  }

  function size(): number {
    return routes.size;
  }

  return { register, unregister, has, getAll, getByTag, clear, size };
}
