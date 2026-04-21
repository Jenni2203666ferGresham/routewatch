export interface RouteOwnership {
  method: string;
  path: string;
  owner: string;
  team?: string;
  contactEmail?: string;
  addedAt: number;
}

export interface RouteOwnershipMap {
  assign(method: string, path: string, owner: string, meta?: { team?: string; contactEmail?: string }): void;
  unassign(method: string, path: string): boolean;
  getOwner(method: string, path: string): RouteOwnership | undefined;
  getByOwner(owner: string): RouteOwnership[];
  getByTeam(team: string): RouteOwnership[];
  getAll(): RouteOwnership[];
  clear(): void;
}

function makeKey(method: string, path: string): string {
  return `${method.toUpperCase()}:${path}`;
}

export function createRouteOwnershipMap(): RouteOwnershipMap {
  const store = new Map<string, RouteOwnership>();

  function assign(
    method: string,
    path: string,
    owner: string,
    meta: { team?: string; contactEmail?: string } = {}
  ): void {
    const key = makeKey(method, path);
    store.set(key, {
      method: method.toUpperCase(),
      path,
      owner,
      team: meta.team,
      contactEmail: meta.contactEmail,
      addedAt: Date.now(),
    });
  }

  function unassign(method: string, path: string): boolean {
    return store.delete(makeKey(method, path));
  }

  function getOwner(method: string, path: string): RouteOwnership | undefined {
    return store.get(makeKey(method, path));
  }

  function getByOwner(owner: string): RouteOwnership[] {
    return Array.from(store.values()).filter((r) => r.owner === owner);
  }

  function getByTeam(team: string): RouteOwnership[] {
    return Array.from(store.values()).filter((r) => r.team === team);
  }

  function getAll(): RouteOwnership[] {
    return Array.from(store.values());
  }

  function clear(): void {
    store.clear();
  }

  return { assign, unassign, getOwner, getByOwner, getByTeam, getAll, clear };
}
