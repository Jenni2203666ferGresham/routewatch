import { renderTableRows, renderFullTable, TableRendererOptions } from './tableRenderer';
import { MetricsStore } from '../metrics/MetricsStore';
import { createSparklineHistory } from './sparklineHistory';

function buildStore(): MetricsStore {
  const store = new MetricsStore();
  store.record({ route: '/api/users', method: 'GET', latency: 120, statusCode: 200 });
  store.record({ route: '/api/users', method: 'GET', latency: 95, statusCode: 200 });
  store.record({ route: '/api/users', method: 'GET', latency: 300, statusCode: 500 });
  store.record({ route: '/api/posts', method: 'POST', latency: 45, statusCode: 201 });
  store.record({ route: '/api/posts', method: 'POST', latency: 60, statusCode: 201 });
  return store;
}

describe('renderTableRows', () => {
  it('returns a row per unique route+method', () => {
    const store = buildStore();
    const history = createSparklineHistory();
    const rows = renderTableRows(store, history);
    expect(rows.length).toBe(2);
  });

  it('each row has expected fields', () => {
    const store = buildStore();
    const history = createSparklineHistory();
    const rows = renderTableRows(store, history);
    const userRow = rows.find((r) => r.route === '/api/users');
    expect(userRow).toBeDefined();
    expect(userRow!.method).toBe('GET');
    expect(userRow!.count).toBe(3);
    expect(typeof userRow!.avgLatency).toBe('string');
    expect(typeof userRow!.errorRate).toBe('string');
  });

  it('respects maxRows option', () => {
    const store = buildStore();
    const history = createSparklineHistory();
    const rows = renderTableRows(store, history, { maxRows: 1 });
    expect(rows.length).toBe(1);
  });

  it('sorts by count when sortBy is count', () => {
    const store = buildStore();
    const history = createSparklineHistory();
    const rows = renderTableRows(store, history, { sortBy: 'count' });
    expect(rows[0].count).toBeGreaterThanOrEqual(rows[1].count);
  });

  it('sorts by route alphabetically when sortBy is route', () => {
    const store = buildStore();
    const history = createSparklineHistory();
    const rows = renderTableRows(store, history, { sortBy: 'route' });
    expect(rows[0].route <= rows[1].route).toBe(true);
  });

  it('omits sparkline field when showSparklines is false', () => {
    const store = buildStore();
    const history = createSparklineHistory();
    const rows = renderTableRows(store, history, { showSparklines: false });
    rows.forEach((r) => expect(r.sparkline).toBeUndefined());
  });
});

describe('renderFullTable', () => {
  it('returns a non-empty string', () => {
    const store = buildStore();
    const history = createSparklineHistory();
    const output = renderFullTable(store, history);
    expect(typeof output).toBe('string');
    expect(output.length).toBeGreaterThan(0);
  });

  it('includes route names in output', () => {
    const store = buildStore();
    const history = createSparklineHistory();
    const output = renderFullTable(store, history);
    expect(output).toContain('/api/users');
    expect(output).toContain('/api/posts');
  });

  it('includes header labels', () => {
    const store = buildStore();
    const history = createSparklineHistory();
    const output = renderFullTable(store, history);
    expect(output).toContain('Route');
    expect(output).toContain('Avg Latency');
  });
});
