import { formatLatency, formatErrorRate, formatRow, formatTable } from './formatters';
import { RouteStats } from '../metrics/RouteMetrics';

const makeStats = (overrides: Partial<RouteStats> = {}): RouteStats => ({
  hits: 10,
  errors: 1,
  totalLatency: 500,
  avgLatency: 50,
  minLatency: 10,
  maxLatency: 120,
  ...overrides,
});

describe('formatLatency', () => {
  it('returns <1ms for sub-millisecond values', () => {
    expect(formatLatency(0.5)).toBe('<1ms');
  });

  it('returns <1ms for zero', () => {
    expect(formatLatency(0)).toBe('<1ms');
  });

  it('formats milliseconds correctly', () => {
    expect(formatLatency(42)).toBe('42ms');
    expect(formatLatency(999)).toBe('999ms');
  });

  it('formats seconds for values >= 1000ms', () => {
    expect(formatLatency(1000)).toBe('1.00s');
    expect(formatLatency(2500)).toBe('2.50s');
  });
});

describe('formatErrorRate', () => {
  it('returns 0.00% when hits is zero', () => {
    expect(formatErrorRate(0, 0)).toBe('0.00%');
  });

  it('calculates correct percentage', () => {
    expect(formatErrorRate(1, 10)).toBe('10.00%');
    expect(formatErrorRate(3, 4)).toBe('75.00%');
  });

  it('returns 100.00% when all requests are errors', () => {
    expect(formatErrorRate(5, 5)).toBe('100.00%');
  });
});

describe('formatRow', () => {
  it('splits route into method and path', () => {
    const row = formatRow('GET /api/users', makeStats());
    expect(row.method).toBe('GET');
    expect(row.path).toBe('/api/users');
  });

  it('formats latency and error rate fields', () => {
    const row = formatRow('POST /login', makeStats({ avgLatency: 200, errors: 2, hits: 20 }));
    expect(row.avgLatency).toBe('200ms');
    expect(row.errorRate).toBe('10.00%');
  });

  it('includes min and max latency fields', () => {
    const row = formatRow('GET /ping', makeStats({ minLatency: 5, maxLatency: 300 }));
    expect(row.minLatency).toBe('5ms');
    expect(row.maxLatency).toBe('300ms');
  });
});

describe('formatTable', () => {
  it('includes header row', () => {
    const row = formatRow('GET /health', makeStats({ hits: 5 }));
    const table = formatTable([row]);
    expect(table).toContain('METHOD');
    expect(table).toContain('PATH');
    expect(table).toContain('HITS');
  });

  it('includes data rows', () => {
    const row = formatRow('DELETE /item', makeStats({ hits: 3 }));
    const table = formatTable([row]);
    expect(table).toContain('DELETE');
    expect(table).toContain('/item');
    expect(table).toContain('3');
  });

  it('returns empty body with no rows', () => {
    const table = formatTable([]);
    expect(table).toContain('METHOD');
  });
});
