export interface RouteAlias {
  alias: string;
  target: string;
}

export interface RouteAliasMap {
  addAlias(alias: string, target: string): void;
  removeAlias(alias: string): boolean;
  resolve(route: string): string;
  getAll(): RouteAlias[];
  hasAlias(alias: string): boolean;
  clear(): void;
}

export function createRouteAliasMap(): RouteAliasMap {
  const map = new Map<string, string>();

  function addAlias(alias: string, target: string): void {
    if (!alias || !target) throw new Error('alias and target are required');
    map.set(alias, target);
  }

  function removeAlias(alias: string): boolean {
    return map.delete(alias);
  }

  function resolve(route: string): string {
    return map.get(route) ?? route;
  }

  function getAll(): RouteAlias[] {
    return Array.from(map.entries()).map(([alias, target]) => ({ alias, target }));
  }

  function hasAlias(alias: string): boolean {
    return map.has(alias);
  }

  function clear(): void {
    map.clear();
  }

  return { addAlias, removeAlias, resolve, getAll, hasAlias, clear };
}
