import { MetricsStore } from '../metrics/MetricsStore';
import { replayMetrics } from './replayMetrics';
import { renderDashboard } from '../dashboard/render';
import * as path from 'path';

export interface ReplayCommandOptions {
  file: string;
  output?: 'dashboard' | 'json';
}

export function runReplayCommand(options: ReplayCommandOptions, store?: MetricsStore): void {
  const resolvedPath = path.resolve(options.file);
  const metricsStore = store ?? new MetricsStore();

  let count: number;
  try {
    count = replayMetrics(resolvedPath, metricsStore);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[routewatch] Failed to replay metrics: ${message}`);
    process.exit(1);
  }

  console.log(`[routewatch] Replayed ${count} entries from ${resolvedPath}`);

  if (options.output === 'json') {
    const all = metricsStore.getAll();
    console.log(JSON.stringify(all, null, 2));
    return;
  }

  const dashboard = renderDashboard(metricsStore);
  console.log(dashboard);
}
