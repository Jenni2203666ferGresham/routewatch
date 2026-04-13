import { MetricsStore } from '../metrics/MetricsStore';
import * as fs from 'fs';

export interface ReplayEntry {
  route: string;
  method: string;
  statusCode: number;
  latencyMs: number;
  timestamp: number;
}

export function parseReplayFile(filePath: string): ReplayEntry[] {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const ext = filePath.split('.').pop()?.toLowerCase();

  if (ext === 'json') {
    return JSON.parse(raw) as ReplayEntry[];
  }

  if (ext === 'csv') {
    const lines = raw.trim().split('\n');
    const headers = lines[0].split(',');
    return lines.slice(1).map((line) => {
      const values = line.split(',');
      const entry: Record<string, string | number> = {};
      headers.forEach((h, i) => {
        entry[h.trim()] = values[i]?.trim() ?? '';
      });
      return {
        route: String(entry['route']),
        method: String(entry['method']),
        statusCode: Number(entry['statusCode']),
        latencyMs: Number(entry['latencyMs']),
        timestamp: Number(entry['timestamp']),
      } as ReplayEntry;
    });
  }

  throw new Error(`Unsupported replay file format: .${ext}`);
}

export function replayIntoStore(entries: ReplayEntry[], store: MetricsStore): void {
  for (const entry of entries) {
    store.record(entry.route, entry.method, entry.statusCode, entry.latencyMs);
  }
}

export function replayMetrics(filePath: string, store: MetricsStore): number {
  const entries = parseReplayFile(filePath);
  replayIntoStore(entries, store);
  return entries.length;
}
