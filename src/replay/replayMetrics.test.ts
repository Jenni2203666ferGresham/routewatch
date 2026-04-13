import * as fs from 'fs';
import { parseReplayFile, replayIntoStore, replayMetrics, ReplayEntry } from './replayMetrics';
import { MetricsStore } from '../metrics/MetricsStore';

jest.mock('fs');
const mockedFs = fs as jest.Mocked<typeof fs>;

const sampleEntries: ReplayEntry[] = [
  { route: '/api/users', method: 'GET', statusCode: 200, latencyMs: 45, timestamp: 1700000000000 },
  { route: '/api/users', method: 'POST', statusCode: 201, latencyMs: 120, timestamp: 1700000001000 },
  { route: '/api/items', method: 'GET', statusCode: 500, latencyMs: 300, timestamp: 1700000002000 },
];

const csvContent = `route,method,statusCode,latencyMs,timestamp
/api/users,GET,200,45,1700000000000
/api/users,POST,201,120,1700000001000
/api/items,GET,500,300,1700000002000`;

describe('parseReplayFile', () => {
  it('parses a JSON replay file', () => {
    mockedFs.readFileSync.mockReturnValue(JSON.stringify(sampleEntries) as any);
    const result = parseReplayFile('metrics.json');
    expect(result).toHaveLength(3);
    expect(result[0].route).toBe('/api/users');
    expect(result[2].statusCode).toBe(500);
  });

  it('parses a CSV replay file', () => {
    mockedFs.readFileSync.mockReturnValue(csvContent as any);
    const result = parseReplayFile('metrics.csv');
    expect(result).toHaveLength(3);
    expect(result[1].method).toBe('POST');
    expect(result[1].latencyMs).toBe(120);
  });

  it('throws on unsupported file extension', () => {
    mockedFs.readFileSync.mockReturnValue('' as any);
    expect(() => parseReplayFile('metrics.xml')).toThrow('Unsupported replay file format');
  });
});

describe('replayIntoStore', () => {
  it('records all entries into the store', () => {
    const store = new MetricsStore();
    replayIntoStore(sampleEntries, store);
    const all = store.getAll();
    expect(Object.keys(all).length).toBeGreaterThan(0);
  });
});

describe('replayMetrics', () => {
  it('returns the number of replayed entries', () => {
    mockedFs.readFileSync.mockReturnValue(JSON.stringify(sampleEntries) as any);
    const store = new MetricsStore();
    const count = replayMetrics('metrics.json', store);
    expect(count).toBe(3);
  });
});
