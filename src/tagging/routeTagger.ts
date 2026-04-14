/**
 * routeTagger.ts
 * Allows attaching user-defined tags (key-value pairs) to routes for
 * grouping, filtering, and annotating dashboard output.
 */

export interface RouteTag {
  key: string;
  value: string;
}

export interface RouteTaggerConfig {
  /** Map of route pattern -> list of tags */
  tags: Record<string, RouteTag[]>;
}

export interface RouteTagger {
  addTag(route: string, tag: RouteTag): void;
  removeTag(route: string, key: string): void;
  getTags(route: string): RouteTag[];
  getTagValue(route: string, key: string): string | undefined;
  getRoutesWithTag(key: string, value?: string): string[];
  getAllTags(): Record<string, RouteTag[]>;
  clear(route?: string): void;
}

export function createRouteTagger(config?: Partial<RouteTaggerConfig>): RouteTagger {
  const store: Record<string, RouteTag[]> = {};

  if (config?.tags) {
    for (const [route, tags] of Object.entries(config.tags)) {
      store[route] = [...tags];
    }
  }

  return {
    addTag(route: string, tag: RouteTag): void {
      if (!store[route]) store[route] = [];
      const existing = store[route].findIndex((t) => t.key === tag.key);
      if (existing >= 0) {
        store[route][existing] = tag;
      } else {
        store[route].push(tag);
      }
    },

    removeTag(route: string, key: string): void {
      if (!store[route]) return;
      store[route] = store[route].filter((t) => t.key !== key);
    },

    getTags(route: string): RouteTag[] {
      return store[route] ? [...store[route]] : [];
    },

    getTagValue(route: string, key: string): string | undefined {
      return store[route]?.find((t) => t.key === key)?.value;
    },

    getRoutesWithTag(key: string, value?: string): string[] {
      return Object.entries(store)
        .filter(([, tags]) =>
          tags.some((t) => t.key === key && (value === undefined || t.value === value))
        )
        .map(([route]) => route);
    },

    getAllTags(): Record<string, RouteTag[]> {
      const copy: Record<string, RouteTag[]> = {};
      for (const [route, tags] of Object.entries(store)) {
        copy[route] = [...tags];
      }
      return copy;
    },

    clear(route?: string): void {
      if (route) {
        delete store[route];
      } else {
        for (const key of Object.keys(store)) delete store[key];
      }
    },
  };
}
