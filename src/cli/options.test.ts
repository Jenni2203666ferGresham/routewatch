import { parseCliOptions } from './options';

describe('parseCliOptions', () => {
  it('returns defaults when given minimal input', () => {
    const result = parseCliOptions({});
    expect(result.port).toBe(9091);
    expect(result.interval).toBe(1000);
    expect(result.routes).toEqual([]);
    expect(result.color).toBe(true);
  });

  it('parses valid port and interval', () => {
    const result = parseCliOptions({ port: '3000', interval: '500' });
    expect(result.port).toBe(3000);
    expect(result.interval).toBe(500);
  });

  it('throws on invalid port (NaN)', () => {
    expect(() => parseCliOptions({ port: 'abc' })).toThrow(/Invalid port/);
  });

  it('throws on out-of-range port', () => {
    expect(() => parseCliOptions({ port: '99999' })).toThrow(/Invalid port/);
    expect(() => parseCliOptions({ port: '0' })).toThrow(/Invalid port/);
  });

  it('throws on interval below minimum', () => {
    expect(() => parseCliOptions({ interval: '50' })).toThrow(/Invalid interval/);
  });

  it('throws on non-numeric interval', () => {
    expect(() => parseCliOptions({ interval: 'fast' })).toThrow(/Invalid interval/);
  });

  it('parses route filters', () => {
    const result = parseCliOptions({ routes: ['/api/users', '/api/posts'] });
    expect(result.routes).toEqual(['/api/users', '/api/posts']);
  });

  it('sets color to false when --no-color is passed', () => {
    const result = parseCliOptions({ color: false });
    expect(result.color).toBe(false);
  });

  it('defaults routes to empty array when undefined', () => {
    const result = parseCliOptions({ routes: undefined });
    expect(result.routes).toEqual([]);
  });
});
