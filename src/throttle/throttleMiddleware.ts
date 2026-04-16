import { Request, Response, NextFunction } from 'express';
import { ThrottleConfig, buildThrottleConfig } from './throttleConfig';
import { createThrottleTracker, ThrottleTracker } from './throttleTracker';

export interface ThrottleMiddlewareOptions extends Partial<ThrottleConfig> {}

export function createThrottleMiddleware(
  options: ThrottleMiddlewareOptions = {}
) {
  const config = buildThrottleConfig(options);
  const tracker = createThrottleTracker();
  const activeCounts = new Map<string, number>();

  function getKey(req: Request): string {
    return config.perRoute ? (req.route?.path ?? req.path) : '__global__';
  }

  function middleware(req: Request, res: Response, next: NextFunction): void {
    const key = getKey(req);
    const current = activeCounts.get(key) ?? 0;

    if (current >= config.maxConcurrent) {
      tracker.reject(key);
      res.status(429).json({ error: 'Too many concurrent requests' });
      return;
    }

    activeCounts.set(key, current + 1);
    tracker.acquire(key);

    const finish = () => {
      const count = activeCounts.get(key) ?? 1;
      activeCounts.set(key, Math.max(0, count - 1));
      tracker.release(key);
    };

    res.on('finish', finish);
    res.on('close', finish);

    next();
  }

  return { middleware, tracker, config };
}
