import { MetricsStore } from '../metrics/MetricsStore';

export interface RateLimitEvent {
  route: string;
  method: string;
  clientIp: string;
  timestamp: number;
  limitHit: boolean;
}

export interface RateLimitStats {
  route: string;
  method: string;
  totalRequests: number;
  limitHits: number;
  limitHitRate: number;
  uniqueClients: number;
}

export interface RateLimitTracker {
  record: (event: RateLimitEvent) => void;
  getStats: () => RateLimitStats[];
  getStatsForRoute: (route: string, method: string) => RateLimitStats | undefined;
  reset: () => void;
}

export function createRateLimitTracker(): RateLimitTracker {
  const events: RateLimitEvent[] = [];

  function record(event: RateLimitEvent): void {
    events.push(event);
  }

  function getStats(): RateLimitStats[] {
    const grouped = new Map<string, RateLimitEvent[]>();

    for (const event of events) {
      const key = `${event.method}:${event.route}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(event);
    }

    const stats: RateLimitStats[] = [];
    for (const [key, group] of grouped.entries()) {
      const [method, ...routeParts] = key.split(':');
      const route = routeParts.join(':');
      const limitHits = group.filter(e => e.limitHit).length;
      const uniqueClients = new Set(group.map(e => e.clientIp)).size;
      stats.push({
        route,
        method,
        totalRequests: group.length,
        limitHits,
        limitHitRate: group.length > 0 ? limitHits / group.length : 0,
        uniqueClients,
      });
    }
    return stats;
  }

  function getStatsForRoute(route: string, method: string): RateLimitStats | undefined {
    return getStats().find(s => s.route === route && s.method === method);
  }

  function reset(): void {
    events.length = 0;
  }

  return { record, getStats, getStatsForRoute, reset };
}
