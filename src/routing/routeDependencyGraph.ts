export interface RouteDependency {
  from: string;
  to: string;
  label?: string;
}

export interface RouteDependencyGraph {
  addDependency(from: string, to: string, label?: string): void;
  removeDependency(from: string, to: string): void;
  getDependencies(route: string): RouteDependency[];
  getDependents(route: string): RouteDependency[];
  hasCycle(): boolean;
  getAll(): RouteDependency[];
  clear(): void;
}

export function createRouteDependencyGraph(): RouteDependencyGraph {
  const edges: RouteDependency[] = [];

  function addDependency(from: string, to: string, label?: string): void {
    const exists = edges.some(e => e.from === from && e.to === to);
    if (!exists) {
      edges.push({ from, to, ...(label !== undefined ? { label } : {}) });
    }
  }

  function removeDependency(from: string, to: string): void {
    const idx = edges.findIndex(e => e.from === from && e.to === to);
    if (idx !== -1) edges.splice(idx, 1);
  }

  function getDependencies(route: string): RouteDependency[] {
    return edges.filter(e => e.from === route);
  }

  function getDependents(route: string): RouteDependency[] {
    return edges.filter(e => e.to === route);
  }

  function hasCycle(): boolean {
    const visited = new Set<string>();
    const stack = new Set<string>();

    function dfs(node: string): boolean {
      if (stack.has(node)) return true;
      if (visited.has(node)) return false;
      visited.add(node);
      stack.add(node);
      for (const edge of edges.filter(e => e.from === node)) {
        if (dfs(edge.to)) return true;
      }
      stack.delete(node);
      return false;
    }

    const nodes = new Set(edges.flatMap(e => [e.from, e.to]));
    for (const node of nodes) {
      if (dfs(node)) return true;
    }
    return false;
  }

  function getAll(): RouteDependency[] {
    return [...edges];
  }

  function clear(): void {
    edges.length = 0;
  }

  return { addDependency, removeDependency, getDependencies, getDependents, hasCycle, getAll, clear };
}
