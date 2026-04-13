import * as path from 'path';
import { MetricsStore } from '../metrics/MetricsStore';
import { exportMetrics, ExportFormat } from '../export/exportMetrics';

export interface ExportCommandOptions {
  format?: string;
  output?: string;
  store: MetricsStore;
}

export function runExportCommand(options: ExportCommandOptions): void {
  const format = (options.format ?? 'json') as ExportFormat;
  const outputPath = options.output ?? `routewatch-export.${format}`;

  if (!['json', 'csv'].includes(format)) {
    console.error(`[routewatch] Unsupported format "${format}". Use "json" or "csv".`);
    process.exit(1);
  }

  const resolvedPath = path.resolve(outputPath);

  try {
    exportMetrics({ format, outputPath: resolvedPath, store: options.store });
    console.log(`[routewatch] Metrics exported to ${resolvedPath} (${format.toUpperCase()})`);
  } catch (err) {
    console.error(`[routewatch] Export failed: ${(err as Error).message}`);
    process.exit(1);
  }
}
