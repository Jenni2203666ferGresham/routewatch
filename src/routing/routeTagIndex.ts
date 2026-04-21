export interface TagIndexEntry {
  method: string;
  path: string;
  tags: string[];
}

export interface RouteTagIndex {
  addTags(method: string, path: string, tags: string[]): void;
  removeTags(method: string, path: string, tags: string[]): void;
  getTags(method: string, path: string): string[];
  getRoutesByTag(tag: string): TagIndexEntry[];
  getAllTags(): string[];
  clear(): void;
  size(): number;
}

function makeKey(method: string, path: string): string {
  return `${method.toUpperCase()}:${path}`;
}

export function createRouteTagIndex(): RouteTagIndex {
  const routeToTags = new Map<string, Set<string>>();
  const tagToRoutes = new Map<string, Set<string>>();

  function addTags(method: string, path: string, tags: string[]): void {
    const key = makeKey(method, path);
    if (!routeToTags.has(key)) routeToTags.set(key, new Set());
    for (const tag of tags) {
      routeToTags.get(key)!.add(tag);
      if (!tagToRoutes.has(tag)) tagToRoutes.set(tag, new Set());
      tagToRoutes.get(tag)!.add(key);
    }
  }

  function removeTags(method: string, path: string, tags: string[]): void {
    const key = makeKey(method, path);
    const existing = routeToTags.get(key);
    if (!existing) return;
    for (const tag of tags) {
      existing.delete(tag);
      tagToRoutes.get(tag)?.delete(key);
      if (tagToRoutes.get(tag)?.size === 0) tagToRoutes.delete(tag);
    }
    if (existing.size === 0) routeToTags.delete(key);
  }

  function getTags(method: string, path: string): string[] {
    return Array.from(routeToTags.get(makeKey(method, path)) ?? []);
  }

  function getRoutesByTag(tag: string): TagIndexEntry[] {
    const keys = tagToRoutes.get(tag);
    if (!keys) return [];
    return Array.from(keys).map((key) => {
      const [method, ...rest] = key.split(':');
      const routePath = rest.join(':');
      return { method, path: routePath, tags: getTags(method, routePath) };
    });
  }

  function getAllTags(): string[] {
    return Array.from(tagToRoutes.keys());
  }

  function clear(): void {
    routeToTags.clear();
    tagToRoutes.clear();
  }

  function size(): number {
    return routeToTags.size;
  }

  return { addTags, removeTags, getTags, getRoutesByTag, getAllTags, clear, size };
}
