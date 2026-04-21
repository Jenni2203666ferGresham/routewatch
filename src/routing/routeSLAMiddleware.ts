import { IncomingMessage, ServerResponse } from 'http';
import { createSLATracker, SLATarget, SLAStatus, SLATracker } from './routeSLATracker';

export interface SLAMiddlewareOptions {
  targets?: SLATarget[];
  onViolation?: (status: SLAStatus) => void;
  windowMs?: number;
}

interface RouteWindow {
  latencies: number[];
  errors: number;
  total: number;
  startedAt: number;
}

export function createSLAMiddleware(options: SLAMiddlewareOptions = {}) {
  const tracker: SLATracker = createSLATracker();
  const windowMs = options.windowMs ?? 60_000;
  const windows = new Map<string, RouteWindow>();

  for (const t of options.targets ?? []) {
    tracker.addTarget(t);
  }

  function getWindow(key: string): RouteWindow {
    let w = windows.get(key);
    if (!w || Date.now() - w.startedAt > windowMs) {
      w = { latencies: [], errors: 0, total: 0, startedAt: Date.now() };
      windows.set(key, w);
    }
    return w;
  }

  function middleware(
    req: IncomingMessage & { routePath?: string },
    res: ServerResponse,
    next: () => void
  ): void {
    const start = Date.now();
    res.on('finish', () => {
      const route = req.routePath ?? req.url ?? '/';
      const method = req.method ?? 'GET';
      const latency = Date.now() - start;
      const key = `${method.toUpperCase()}:${route}`;
      const w = getWindow(key);
      w.latencies.push(latency);
      w.total += 1;
      if (res.statusCode >= 500) w.errors += 1;

      const sorted = [...w.latencies].sort((a, b) => a - b);
      const idx = Math.floor(sorted.length * 0.99);
      const p99 = sorted[Math.min(idx, sorted.length - 1)] ?? 0;
      const errorRatePct = w.total > 0 ? (w.errors / w.total) * 100 : 0;
      const uptimePct = w.total > 0 ? ((w.total - w.errors) / w.total) * 100 : 100;

      const status = tracker.evaluate(route, method, p99, errorRatePct, uptimePct);
      if (status && !status.passing && options.onViolation) {
        options.onViolation(status);
      }
    });
    next();
  }

  function getTracker(): SLATracker {
    return tracker;
  }

  function reset(): void {
    windows.clear();
  }

  return { middleware, getTracker, reset };
}
