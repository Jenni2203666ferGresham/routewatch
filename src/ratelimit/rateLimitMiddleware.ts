import { Request, Response, NextFunction } from 'express';
import { MetricsStore } from '../metrics/MetricsStore';
import { createRateLimitTracker, RateLimitTracker } from './rateLimitTracker';

export interface RateLimitMiddlewareOptions {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
}

export interface RateLimitMiddlewareResult {
  middleware: (req: Request, res: Response, next: NextFunction) => void;
  tracker: RateLimitTracker;
}

const DEFAULT_KEY_GENERATOR = (req: Request): string =>
  (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || 'unknown';

export function createRateLimitMiddleware(
  options: RateLimitMiddlewareOptions
): RateLimitMiddlewareResult {
  const { windowMs, maxRequests, keyGenerator = DEFAULT_KEY_GENERATOR } = options;
  const tracker = createRateLimitTracker();
  const requestCounts = new Map<string, { count: number; windowStart: number }>();

  function middleware(req: Request, res: Response, next: NextFunction): void {
    const clientIp = keyGenerator(req);
    const route = (req.route?.path as string) || req.path;
    const method = req.method;
    const now = Date.now();
    const windowKey = `${clientIp}:${method}:${route}`;

    let entry = requestCounts.get(windowKey);
    if (!entry || now - entry.windowStart > windowMs) {
      entry = { count: 0, windowStart: now };
      requestCounts.set(windowKey, entry);
    }
    entry.count += 1;

    const limitHit = entry.count > maxRequests;
    tracker.record({ route, method, clientIp, timestamp: now, limitHit });

    if (limitHit) {
      res.status(429).json({ error: 'Too Many Requests' });
      return;
    }
    next();
  }

  return { middleware, tracker };
}
