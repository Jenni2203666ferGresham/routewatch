import { createHash } from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import {
  createRouteFingerprintTracker,
  RouteFingerprintTracker,
} from './routeFingerprintTracker';

export interface FingerprintMiddlewareOptions {
  resolveRoute?: (req: Request) => string;
  computeFingerprint?: (req: Request) => string;
}

function defaultResolveRoute(req: Request): string {
  return (req as any).route?.path ?? req.path ?? '/';
}

function defaultComputeFingerprint(req: Request): string {
  const parts = [
    req.method.toUpperCase(),
    req.headers['content-type'] ?? '',
    Object.keys(req.query ?? {}).sort().join(','),
    Object.keys((req as any).body ?? {}).sort().join(','),
  ].join('|');
  return createHash('sha1').update(parts).digest('hex').slice(0, 16);
}

export interface RouteFingerprintMiddleware {
  middleware: (req: Request, res: Response, next: NextFunction) => void;
  getTracker: () => RouteFingerprintTracker;
  reset: () => void;
}

export function createRouteFingerprintMiddleware(
  options: FingerprintMiddlewareOptions = {}
): RouteFingerprintMiddleware {
  const tracker = createRouteFingerprintTracker();
  const resolveRoute = options.resolveRoute ?? defaultResolveRoute;
  const computeFingerprint = options.computeFingerprint ?? defaultComputeFingerprint;

  function middleware(req: Request, res: Response, next: NextFunction): void {
    const route = resolveRoute(req);
    const fingerprint = computeFingerprint(req);
    tracker.record(req.method, route, fingerprint);
    (req as any).routeFingerprint = fingerprint;
    next();
  }

  return {
    middleware,
    getTracker: () => tracker,
    reset: () => tracker.reset(),
  };
}
