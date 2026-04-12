export interface RouteRecord {
  method: string;
  path: string;
  hits: number;
  totalLatencyMs: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  lastCalledAt: Date | null;
}

export interface LatencySample {
  method: string;
  path: string;
  latencyMs: number;
  timestamp: Date;
}

export class RouteMetrics {
  private records: Map<string, RouteRecord> = new Map();

  private buildKey(method: string, path: string): string {
    return `${method.toUpperCase()}:${path}`;
  }

  record(sample: LatencySample): void {
    const key = this.buildKey(sample.method, sample.path);
    const existing = this.records.get(key);

    if (existing) {
      existing.hits += 1;
      existing.totalLatencyMs += sample.latencyMs;
      existing.minLatencyMs = Math.min(existing.minLatencyMs, sample.latencyMs);
      existing.maxLatencyMs = Math.max(existing.maxLatencyMs, sample.latencyMs);
      existing.lastCalledAt = sample.timestamp;
    } else {
      this.records.set(key, {
        method: sample.method.toUpperCase(),
        path: sample.path,
        hits: 1,
        totalLatencyMs: sample.latencyMs,
        minLatencyMs: sample.latencyMs,
        maxLatencyMs: sample.latencyMs,
        lastCalledAt: sample.timestamp,
      });
    }
  }

  getAvgLatency(method: string, path: string): number | null {
    const record = this.records.get(this.buildKey(method, path));
    if (!record || record.hits === 0) return null;
    return record.totalLatencyMs / record.hits;
  }

  getAll(): RouteRecord[] {
    return Array.from(this.records.values());
  }

  reset(): void {
    this.records.clear();
  }
}
