import { Request, Response, NextFunction } from 'express';
import {
  TraceContextStore,
  startTrace,
  finishTrace,
} from './traceContext';

function generateSpanId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export interface TracingMiddlewareOptions {
  getTraceId?: (req: Request) => string;
  getRoute?: (req: Request) => string;
  onFinish?: (ctx: ReturnType<typeof finishTrace>) => void;
}

export function createTracingMiddleware(
  store: TraceContextStore,
  options: TracingMiddlewareOptions = {}
) {
  const {
    getTraceId = (req) =>
      (req.headers['x-trace-id'] as string) || generateSpanId(),
    getRoute = (req) => req.route?.path ?? req.path,
    onFinish,
  } = options;

  return function tracingMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    const traceId = getTraceId(req);
    const spanId = generateSpanId();
    const route = getRoute(req);
    const method = req.method;

    startTrace(store, { traceId, spanId, route, method, tags: {} });

    res.setHeader('x-trace-id', traceId);
    res.setHeader('x-span-id', spanId);

    res.on('finish', () => {
      const ctx = finishTrace(store, spanId);
      if (onFinish) onFinish(ctx);
    });

    next();
  };
}
