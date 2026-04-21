export type Permission = string;

export interface RoutePermissionEntry {
  method: string;
  path: string;
  permissions: Permission[];
  requireAll: boolean;
}

export interface RoutePermissionMap {
  assign(method: string, path: string, permissions: Permission[], requireAll?: boolean): void;
  unassign(method: string, path: string): void;
  getPermissions(method: string, path: string): RoutePermissionEntry | undefined;
  hasPermission(method: string, path: string, permission: Permission): boolean;
  check(method: string, path: string, userPermissions: Permission[]): boolean;
  getAll(): RoutePermissionEntry[];
  clear(): void;
}

function makeKey(method: string, path: string): string {
  return `${method.toUpperCase()}:${path}`;
}

export function createRoutePermissionMap(): RoutePermissionMap {
  const store = new Map<string, RoutePermissionEntry>();

  function assign(method: string, path: string, permissions: Permission[], requireAll = true): void {
    const key = makeKey(method, path);
    store.set(key, { method: method.toUpperCase(), path, permissions: [...permissions], requireAll });
  }

  function unassign(method: string, path: string): void {
    store.delete(makeKey(method, path));
  }

  function getPermissions(method: string, path: string): RoutePermissionEntry | undefined {
    return store.get(makeKey(method, path));
  }

  function hasPermission(method: string, path: string, permission: Permission): boolean {
    const entry = getPermissions(method, path);
    if (!entry) return true;
    return entry.permissions.includes(permission);
  }

  function check(method: string, path: string, userPermissions: Permission[]): boolean {
    const entry = getPermissions(method, path);
    if (!entry || entry.permissions.length === 0) return true;
    if (entry.requireAll) {
      return entry.permissions.every((p) => userPermissions.includes(p));
    }
    return entry.permissions.some((p) => userPermissions.includes(p));
  }

  function getAll(): RoutePermissionEntry[] {
    return Array.from(store.values());
  }

  function clear(): void {
    store.clear();
  }

  return { assign, unassign, getPermissions, hasPermission, check, getAll, clear };
}
