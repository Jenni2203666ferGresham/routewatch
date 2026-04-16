import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  createSnapshot,
  saveSnapshot,
  loadSnapshot,
  listSnapshots,
  createSnapshotManager,
} from './snapshotManager';
import { MetricsStore } from '../metrics/MetricsStore';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'routewatch-snapshot-'));
}

function makeStore(): MetricsStore {
  const store = new MetricsStore();
  store.record({ route: '/api/users', method: 'GET', statusCode: 200, latencyMs: 42, timestamp: Date.now() });
  store.record({ route: '/api/orders', method: 'POST', statusCode: 500, latencyMs: 120, timestamp: Date.now() });
  return store;
}

describe('createSnapshot', () => {
  it('returns a snapshot with timestamp, label, and data', () => {
    const store = makeStore();
    const snap = createSnapshot(store, { outputDir: '/tmp', label: 'test-snap' });
    expect(snap.label).toBe('test-snap');
    expect(typeof snap.timestamp).toBe('string');
    expect(snap.data).toBeDefined();
    expect(Array.isArray(snap.data.rows)).toBe(true);
  });

  it('uses a default label when none provided', () => {
    const store = makeStore();
    const snap = createSnapshot(store, { outputDir: '/tmp' });
    expect(snap.label).toMatch(/^snapshot-\d+$/);
  });
});

describe('saveSnapshot and loadSnapshot', () => {
  it('round-trips a snapshot to disk', () => {
    const dir = makeTempDir();
    const store = makeStore();
    const snap = createSnapshot(store, { outputDir: dir, label: 'round-trip' });
    const filepath = saveSnapshot(snap, { outputDir: dir, label: 'round-trip' });
    expect(fs.existsSync(filepath)).toBe(true);
    const loaded = loadSnapshot(filepath);
    expect(loaded.label).toBe('round-trip');
    expect(loaded.data).toBeDefined();
  });

  it('throws when loading a non-existent file', () => {
    expect(() => loadSnapshot('/tmp/does-not-exist.json')).toThrow('Snapshot file not found');
  });

  it('writes pretty JSON when pretty=true', () => {
    const dir = makeTempDir();
    const store = makeStore();
    const snap = createSnapshot(store, { outputDir: dir, label: 'pretty' });
    const filepath = saveSnapshot(snap, { outputDir: dir, label: 'pretty', pretty: true });
    const raw = fs.readFileSync(filepath, 'utf-8');
    expect(raw).toContain('\n');
  });
});

describe('listSnapshots', () => {
  it('returns empty array for missing directory', () => {
    expect(listSnapshots('/tmp/no-such-dir-xyz')).toEqual([]);
  });

  it('lists saved snapshot files', () => {
    const dir = makeTempDir();
    const store = makeStore();
    const snap1 = createSnapshot(store, { outputDir: dir, label: 'snap-a' });
    const snap2 = createSnapshot(store, { outputDir: dir, label: 'snap-b' });
    saveSnapshot(snap1, { outputDir: dir, label: 'snap-a' });
    saveSnapshot(snap2, { outputDir: dir, label: 'snap-b' });
    const files = listSnapshots(dir);
    expect(files).toHaveLength(2);
  });
});

describe('createSnapshotManager', () => {
  it('captures and lists snapshots', () => {
    const dir = makeTempDir();
    const store = makeStore();
    const manager = createSnapshotManager(store, dir);
    const fp = manager.capture('mgr-snap');
    expect(fs.existsSync(fp)).toBe(true);
    expect(manager.list()).toHaveLength(1);
  });

  it('loads a snapshot by filepath', () => {
    const dir = makeTempDir();
    const store = makeStore();
    const manager = createSnapshotManager(store, dir);
    const fp = manager.capture('load-test');
    const snap = manager.load(fp);
    expect(snap.label).toBe('load-test');
  });
});
