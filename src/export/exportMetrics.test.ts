import * as fs from 'fs';
import * as path from 'path';
import { exportToJson, exportToCsv, exportMetrics } from './exportMetrics';
import { MetricsStore } from '../metrics/MetricsStore';
import { RouteMetrics } from '../metrics/RouteMetrics';

const mockMetrics: RouteMetrics[] = [
  {
    route: '/api/users',
    method: 'GET',
    hits: 10,
    errors: 1,
    avgLatency: 42.5,
    minLatency: 10.0,
    maxLatency: 120.0,
  },
  {
    route: '/api/posts',
    method: 'POST',
    hits: 5,
    errors: 0,
    avgLatency: 80.0,
    minLatency: 60.0,
    maxLatency: 100.0,
  },
];

const tmpJson = path.join(__dirname, '__tmp_test_output.json');
const tmpCsv = path.join(__dirname, '__tmp_test_output.csv');

afterEach(() => {
  [tmpJson, tmpCsv].forEach((f) => {
    if (fs.existsSync(f)) fs.unlinkSync(f);
  });
});

describe('exportToJson', () => {
  it('writes valid JSON file with correct fields', () => {
    exportToJson(mockMetrics, tmpJson);
    const content = JSON.parse(fs.readFileSync(tmpJson, 'utf-8'));
    expect(content).toHaveLength(2);
    expect(content[0].route).toBe('/api/users');
    expect(content[0].hits).toBe(10);
  });
});

describe('exportToCsv', () => {
  it('writes CSV file with header and rows', () => {
    exportToCsv(mockMetrics, tmpCsv);
    const lines = fs.readFileSync(tmpCsv, 'utf-8').split('\n');
    expect(lines[0]).toBe('route,method,hits,errors,avgLatency,minLatency,maxLatency');
    expect(lines[1]).toContain('/api/users');
    expect(lines[2]).toContain('/api/posts');
  });
});

describe('exportMetrics', () => {
  it('throws on unsupported format', () => {
    const store = new MetricsStore();
    expect(() =>
      exportMetrics({ format: 'xml' as any, outputPath: tmpJson, store })
    ).toThrow('Unsupported export format');
  });

  it('delegates to exportToJson when format is json', () => {
    const store = new MetricsStore();
    mockMetrics.forEach((m) => store.set(m.route, m.method, m));
    exportMetrics({ format: 'json', outputPath: tmpJson, store });
    expect(fs.existsSync(tmpJson)).toBe(true);
  });
});
