export interface RouteMetadata {
  route: string;
  method: string;
  description?: string;
  tags?: string[];
  deprecated?: boolean;
  addedAt: number;
  updatedAt: number;
  custom?: Record<string, unknown>;
}

export interface RouteMetadataStore {
  set(route: string, method: string, meta: Partial<Omit<RouteMetadata, 'route' | 'method' | 'addedAt' | 'updatedAt'>>): void;
  get(route: string, method: string): RouteMetadata | undefined;
  getAll(): RouteMetadata[];
  getByTag(tag: string): RouteMetadata[];
  delete(route: string, method: string): boolean;
  clear(): void;
  size(): number;
}

function makeKey(route: string, method: string): string {
  return `${method.toUpperCase()}::${route}`;
}

export function createRouteMetadataStore(): RouteMetadataStore {
  const store = new Map<string, RouteMetadata>();

  function set(
    route: string,
    method: string,
    meta: Partial<Omit<RouteMetadata, 'route' | 'method' | 'addedAt' | 'updatedAt'>>
  ): void {
    const key = makeKey(route, method);
    const existing = store.get(key);
    const now = Date.now();
    store.set(key, {
      route,
      method: method.toUpperCase(),
      description: meta.description ?? existing?.description,
      tags: meta.tags ?? existing?.tags ?? [],
      deprecated: meta.deprecated ?? existing?.deprecated ?? false,
      custom: meta.custom ?? existing?.custom,
      addedAt: existing?.addedAt ?? now,
      updatedAt: now,
    });
  }

  function get(route: string, method: string): RouteMetadata | undefined {
    return store.get(makeKey(route, method));
  }

  function getAll(): RouteMetadata[] {
    return Array.from(store.values());
  }

  function getByTag(tag: string): RouteMetadata[] {
    return getAll().filter((m) => m.tags?.includes(tag));
  }

  function del(route: string, method: string): boolean {
    return store.delete(makeKey(route, method));
  }

  function clear(): void {
    store.clear();
  }

  function size(): number {
    return store.size;
  }

  return { set, get, getAll, getByTag, delete: del, clear, size };
}
