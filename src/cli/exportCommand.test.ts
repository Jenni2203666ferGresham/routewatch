import * as fs from 'fs';
import * as path from 'path';
import { runExportCommand } from './exportCommand';
import { MetricsStore } from '../metrics/MetricsStore';

const tmpFile = path.join(__dirname, '__tmp_export_cmd.json');
const tmpCsvFile = path.join(__dirname, '__tmp_export_cmd.csv');

afterEach(() => {
  [tmpFile, tmpCsvFile].forEach((f) => {
    if (fs.existsSync(f)) fs.unlinkSync(f);
  });
});

describe('runExportCommand', () => {
  it('exports metrics to JSON with default format', () => {
    const store = new MetricsStore();
    store.set('/health', 'GET', {
      route: '/health',
      method: 'GET',
      hits: 3,
      errors: 0,
      avgLatency: 5,
      minLatency: 3,
      maxLatency: 8,
    });
    runExportCommand({ store, output: tmpFile, format: 'json' });
    expect(fs.existsSync(tmpFile)).toBe(true);
    const parsed = JSON.parse(fs.readFileSync(tmpFile, 'utf-8'));
    expect(parsed[0].route).toBe('/health');
  });

  it('exports metrics to CSV', () => {
    const store = new MetricsStore();
    store.set('/ping', 'GET', {
      route: '/ping',
      method: 'GET',
      hits: 1,
      errors: 0,
      avgLatency: 2,
      minLatency: 2,
      maxLatency: 2,
    });
    runExportCommand({ store, output: tmpCsvFile, format: 'csv' });
    const content = fs.readFileSync(tmpCsvFile, 'utf-8');
    expect(content).toContain('/ping');
    expect(content).toContain('route,method');
  });

  it('calls process.exit on invalid format', () => {
    const store = new MetricsStore();
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() =>
      runExportCommand({ store, format: 'xml', output: tmpFile })
    ).toThrow('exit');
    exitSpy.mockRestore();
  });
});
