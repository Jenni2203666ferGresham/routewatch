import { Request, Response, NextFunction } from 'express';
import { MetricsStore } from '../metrics/MetricsStore';
import { ComplianceRule, ComplianceSummary, checkCompliance, createRouteComplianceChecker } from './routeComplianceChecker';

export interface RouteComplianceMiddlewareOptions {
  store: MetricsStore;
  rules?: ComplianceRule[];
  onViolation?: (summary: ComplianceSummary) => void;
  refreshIntervalMs?: number;
}

export function createRouteComplianceMiddleware(options: RouteComplianceMiddlewareOptions) {
  const { store, rules, onViolation, refreshIntervalMs = 60_000 } = options;
  const checker = createRouteComplianceChecker(rules);
  let lastSummary: ComplianceSummary | null = null;
  let timer: NodeJS.Timeout | null = null;

  function refresh() {
    const metricsMap = store.getAll();
    lastSummary = checker.check(metricsMap);
    if (onViolation && lastSummary.failed > 0) {
      onViolation(lastSummary);
    }
  }

  function start() {
    refresh();
    timer = setInterval(refresh, refreshIntervalMs);
  }

  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function middleware(req: Request, res: Response, next: NextFunction) {
    next();
  }

  function getSummary(): ComplianceSummary | null {
    return lastSummary;
  }

  function reset() {
    lastSummary = null;
  }

  return { middleware, start, stop, getSummary, reset, refresh };
}
