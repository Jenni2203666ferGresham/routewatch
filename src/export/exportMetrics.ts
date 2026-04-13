import * as fs from 'fs';
import * as path from 'path';
import { MetricsStore } from '../metrics/MetricsStore';
import { RouteMetrics } from '../metrics/RouteMetrics';

export type ExportFormat = 'json' | 'csv';

export interface ExportOptions {
  format: ExportFormat;
  outputPath: string;
  store: MetricsStore;
}

export function exportToJson(metrics: RouteMetrics[], outputPath: string): void {
  const data = metrics.map((m) => ({
    route: m.route,
    method: m.method,
    hits: m.hits,
    errors: m.errors,
    avgLatency: m.avgLatency,
    minLatency: m.minLatency,
    maxLatency: m.maxLatency,
  }));
  const json = JSON.stringify(data, null, 2);
  fs.writeFileSync(path.resolve(outputPath), json, 'utf-8');
}

export function exportToCsv(metrics: RouteMetrics[], outputPath: string): void {
  const header = 'route,method,hits,errors,avgLatency,minLatency,maxLatency';
  const rows = metrics.map((m) =>
    [
      m.route,
      m.method,
      m.hits,
      m.errors,
      m.avgLatency.toFixed(2),
      m.minLatency.toFixed(2),
      m.maxLatency.toFixed(2),
    ].join(',')
  );
  const csv = [header, ...rows].join('\n');
  fs.writeFileSync(path.resolve(outputPath), csv, 'utf-8');
}

export function exportMetrics(options: ExportOptions): void {
  const metrics = options.store.getAll();
  if (options.format === 'json') {
    exportToJson(metrics, options.outputPath);
  } else if (options.format === 'csv') {
    exportToCsv(metrics, options.outputPath);
  } else {
    throw new Error(`Unsupported export format: ${options.format}`);
  }
}
