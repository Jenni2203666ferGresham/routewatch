import { Request, Response, NextFunction } from 'express';
import { CorrelationTracker } from './correlationTracker';
import { MetricsStore } from '../metrics/MetricsStore';

export interface CorrelationMiddlewareOptions {
  traceIdHeader?: string;
  generateTraceId?: () => string;
  tags?: (req: Request) => Record<string, string>;
}

function defaultGenerateTraceId(): string {
  return `rw-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createCorrelationMiddleware(
  tracker: CorrelationTracker,
  store: MetricsStore,
  options: CorrelationMiddlewareOptions = {}
) {
  const {
    traceIdHeader = 'x-trace-id',
    generateTraceId = defaultGenerateTraceId,
    tags = () => ({}),
  } = options;

  return function correlationMiddleware(req: Request, res: Response, next: NextFunction): void {
    const traceId = (req.headers[traceIdHeader] as string) || generateTraceId();
    res.setHeader(traceIdHeader, traceId);
    (req as any).__traceId = traceId;

    const start = Date.now();

    res.on('finish', () => {
      const latencyMs = Date.now() - start;
      const route = (req as any).route?.path ?? req.path ?? 'unknown';
      const method = req.method.toUpperCase();
      const statusCode = res.statusCode;

      const metric = { route, method, statusCode, latencyMs, timestamp: Date.now() };
      store.record(metric);
      tracker.record(traceId, metric, tags(req));
    });

    next();
  };
}
