import * as fs from 'fs';
import * as path from 'path';
import { MetricsStore } from '../metrics/MetricsStore';
import { snapshotDashboard } from '../dashboard/dashboardState';

export interface SnapshotOptions {
  outputDir: string;
  label?: string;
  pretty?: boolean;
}

export interface Snapshot {
  timestamp: string;
  label: string;
  data: ReturnType<typeof snapshotDashboard>;
}

export function createSnapshot(store: MetricsStore, options: SnapshotOptions): Snapshot {
  const timestamp = new Date().toISOString();
  const label = options.label ?? `snapshot-${Date.now()}`;
  const data = snapshotDashboard(store);
  return { timestamp, label, data };
}

export function saveSnapshot(snapshot: Snapshot, options: SnapshotOptions): string {
  const { outputDir, pretty = false } = options;

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filename = `${snapshot.label.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`;
  const filepath = path.join(outputDir, filename);
  const content = pretty
    ? JSON.stringify(snapshot, null, 2)
    : JSON.stringify(snapshot);

  fs.writeFileSync(filepath, content, 'utf-8');
  return filepath;
}

export function loadSnapshot(filepath: string): Snapshot {
  if (!fs.existsSync(filepath)) {
    throw new Error(`Snapshot file not found: ${filepath}`);
  }
  const raw = fs.readFileSync(filepath, 'utf-8');
  return JSON.parse(raw) as Snapshot;
}

export function listSnapshots(outputDir: string): string[] {
  if (!fs.existsSync(outputDir)) return [];
  return fs
    .readdirSync(outputDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => path.join(outputDir, f));
}

export function createSnapshotManager(store: MetricsStore, outputDir: string) {
  return {
    capture(label?: string, pretty = false): string {
      const snapshot = createSnapshot(store, { outputDir, label, pretty });
      return saveSnapshot(snapshot, { outputDir, label, pretty });
    },
    list(): string[] {
      return listSnapshots(outputDir);
    },
    load(filepath: string): Snapshot {
      return loadSnapshot(filepath);
    },
  };
}
