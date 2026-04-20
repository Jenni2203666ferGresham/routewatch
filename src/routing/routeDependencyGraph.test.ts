import { createRouteDependencyGraph } from './routeDependencyGraph';

describe('createRouteDependencyGraph', () => {
  it('adds and retrieves dependencies', () => {
    const graph = createRouteDependencyGraph();
    graph.addDependency('/orders', '/products');
    graph.addDependency('/orders', '/users');
    const deps = graph.getDependencies('/orders');
    expect(deps).toHaveLength(2);
    expect(deps.map(d => d.to)).toContain('/products');
    expect(deps.map(d => d.to)).toContain('/users');
  });

  it('does not add duplicate edges', () => {
    const graph = createRouteDependencyGraph();
    graph.addDependency('/a', '/b');
    graph.addDependency('/a', '/b');
    expect(graph.getAll()).toHaveLength(1);
  });

  it('stores optional label', () => {
    const graph = createRouteDependencyGraph();
    graph.addDependency('/a', '/b', 'calls');
    expect(graph.getAll()[0].label).toBe('calls');
  });

  it('removes a dependency', () => {
    const graph = createRouteDependencyGraph();
    graph.addDependency('/a', '/b');
    graph.removeDependency('/a', '/b');
    expect(graph.getAll()).toHaveLength(0);
  });

  it('ignores remove of non-existent edge', () => {
    const graph = createRouteDependencyGraph();
    expect(() => graph.removeDependency('/x', '/y')).not.toThrow();
  });

  it('returns dependents correctly', () => {
    const graph = createRouteDependencyGraph();
    graph.addDependency('/orders', '/products');
    graph.addDependency('/cart', '/products');
    const dependents = graph.getDependents('/products');
    expect(dependents.map(d => d.from)).toEqual(expect.arrayContaining(['/orders', '/cart']));
  });

  it('detects no cycle in acyclic graph', () => {
    const graph = createRouteDependencyGraph();
    graph.addDependency('/a', '/b');
    graph.addDependency('/b', '/c');
    expect(graph.hasCycle()).toBe(false);
  });

  it('detects a direct cycle', () => {
    const graph = createRouteDependencyGraph();
    graph.addDependency('/a', '/b');
    graph.addDependency('/b', '/a');
    expect(graph.hasCycle()).toBe(true);
  });

  it('detects an indirect cycle', () => {
    const graph = createRouteDependencyGraph();
    graph.addDependency('/a', '/b');
    graph.addDependency('/b', '/c');
    graph.addDependency('/c', '/a');
    expect(graph.hasCycle()).toBe(true);
  });

  it('clears all edges', () => {
    const graph = createRouteDependencyGraph();
    graph.addDependency('/a', '/b');
    graph.addDependency('/b', '/c');
    graph.clear();
    expect(graph.getAll()).toHaveLength(0);
  });

  it('returns empty arrays when route has no edges', () => {
    const graph = createRouteDependencyGraph();
    expect(graph.getDependencies('/unknown')).toEqual([]);
    expect(graph.getDependents('/unknown')).toEqual([]);
  });
});
