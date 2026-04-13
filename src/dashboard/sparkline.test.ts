import { renderSparkline, buildSparklineMap } from './sparkline';

describe('renderSparkline', () => {
  it('returns spaces for empty input', () => {
    const result = renderSparkline([], 8);
    expect(result).toBe('        ');
    expect(result).toHaveLength(8);
  });

  it('returns a string of the requested width', () => {
    const result = renderSparkline([10, 20, 30, 40, 50], 10);
    expect(result).toHaveLength(10);
  });

  it('pads with low blocks when fewer values than width', () => {
    const result = renderSparkline([100], 5);
    expect(result).toHaveLength(5);
  });

  it('uses highest block for maximum value', () => {
    const values = [0, 0, 0, 0, 100];
    const result = renderSparkline(values, 5);
    expect(result[result.length - 1]).toBe('█');
  });

  it('uses lowest block for minimum value when all equal', () => {
    const result = renderSparkline([50, 50, 50], 3);
    // all values equal → normalized to 0 → first block
    expect(result).toBe('▁▁▁');
  });

  it('slices to the last `width` values', () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 100];
    const result = renderSparkline(values, 5);
    expect(result).toHaveLength(5);
    // last value is max, so last char should be highest block
    expect(result[4]).toBe('█');
  });
});

describe('buildSparklineMap', () => {
  it('returns an empty map for empty input', () => {
    const result = buildSparklineMap(new Map());
    expect(result.size).toBe(0);
  });

  it('produces a sparkline string for each route', () => {
    const history = new Map<string, number[]>([
      ['GET /api/users', [10, 20, 30]],
      ['POST /api/orders', [5, 15, 25, 35]],
    ]);
    const result = buildSparklineMap(history, 8);
    expect(result.size).toBe(2);
    expect(result.get('GET /api/users')).toHaveLength(8);
    expect(result.get('POST /api/orders')).toHaveLength(8);
  });

  it('respects custom width', () => {
    const history = new Map([['GET /', [1, 2, 3, 4, 5]]]);
    const result = buildSparklineMap(history, 4);
    expect(result.get('GET /')).toHaveLength(4);
  });
});
