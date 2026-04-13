import { buildFilterConfig, parsePatternList } from './filterConfig';

describe('buildFilterConfig', () => {
  it('returns empty config when no patterns provided', () => {
    const config = buildFilterConfig({});
    expect(config).toEqual({});
  });

  it('sets include patterns when provided', () => {
    const config = buildFilterConfig({ include: ['/api/*'] });
    expect(config.include).toEqual(['/api/*']);
    expect(config.exclude).toBeUndefined();
  });

  it('sets exclude patterns when provided', () => {
    const config = buildFilterConfig({ exclude: ['/health', '/metrics'] });
    expect(config.exclude).toEqual(['/health', '/metrics']);
    expect(config.include).toBeUndefined();
  });

  it('sets both include and exclude when provided', () => {
    const config = buildFilterConfig({
      include: ['/api/*'],
      exclude: ['/api/internal/*'],
    });
    expect(config.include).toEqual(['/api/*']);
    expect(config.exclude).toEqual(['/api/internal/*']);
  });

  it('ignores empty arrays', () => {
    const config = buildFilterConfig({ include: [], exclude: [] });
    expect(config.include).toBeUndefined();
    expect(config.exclude).toBeUndefined();
  });

  it('throws on invalid config', () => {
    expect(() =>
      buildFilterConfig({ include: [''] })
    ).toThrow();
  });
});

describe('parsePatternList', () => {
  it('parses comma-separated patterns', () => {
    expect(parsePatternList('/api/*, /health')).toEqual(['/api/*', '/health']);
  });

  it('returns empty array for undefined input', () => {
    expect(parsePatternList(undefined)).toEqual([]);
  });

  it('returns empty array for empty string', () => {
    expect(parsePatternList('')).toEqual([]);
  });

  it('trims whitespace from patterns', () => {
    expect(parsePatternList('  /api/*  ,  /health  ')).toEqual(['/api/*', '/health']);
  });

  it('filters out blank entries', () => {
    expect(parsePatternList('/api/*,,/health')).toEqual(['/api/*', '/health']);
  });
});
