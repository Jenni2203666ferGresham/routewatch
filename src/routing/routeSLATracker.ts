export interface SLATarget {
  route: string;
  method: string;
  maxLatencyP99Ms: number;
  maxErrorRatePct: number;
  minUptimePct: number;
}

export interface SLAStatus {
  route: string;
  method: string;
  p99LatencyMs: number;
  errorRatePct: number;
  uptimePct: number;
  latencyOk: boolean;
  errorRateOk: boolean;
  uptimeOk: boolean;
  passing: boolean;
}

export interface SLATracker {
  addTarget(target: SLATarget): void;
  removeTarget(route: string, method: string): void;
  evaluate(route: string, method: string, p99Ms: number, errorRatePct: number, uptimePct: number): SLAStatus | null;
  evaluateAll(data: Array<{ route: string; method: string; p99Ms: number; errorRatePct: number; uptimePct: number }>): SLAStatus[];
  getTargets(): SLATarget[];
  getTarget(route: string, method: string): SLATarget | undefined;
}

function makeKey(route: string, method: string): string {
  return `${method.toUpperCase()}:${route}`;
}

export function createSLATracker(): SLATracker {
  const targets = new Map<string, SLATarget>();

  function addTarget(target: SLATarget): void {
    targets.set(makeKey(target.route, target.method), target);
  }

  function removeTarget(route: string, method: string): void {
    targets.delete(makeKey(route, method));
  }

  function evaluate(
    route: string,
    method: string,
    p99Ms: number,
    errorRatePct: number,
    uptimePct: number
  ): SLAStatus | null {
    const target = targets.get(makeKey(route, method));
    if (!target) return null;

    const latencyOk = p99Ms <= target.maxLatencyP99Ms;
    const errorRateOk = errorRatePct <= target.maxErrorRatePct;
    const uptimeOk = uptimePct >= target.minUptimePct;

    return {
      route,
      method,
      p99LatencyMs: p99Ms,
      errorRatePct,
      uptimePct,
      latencyOk,
      errorRateOk,
      uptimeOk,
      passing: latencyOk && errorRateOk && uptimeOk,
    };
  }

  function evaluateAll(
    data: Array<{ route: string; method: string; p99Ms: number; errorRatePct: number; uptimePct: number }>
  ): SLAStatus[] {
    return data
      .map((d) => evaluate(d.route, d.method, d.p99Ms, d.errorRatePct, d.uptimePct))
      .filter((s): s is SLAStatus => s !== null);
  }

  function getTargets(): SLATarget[] {
    return Array.from(targets.values());
  }

  function getTarget(route: string, method: string): SLATarget | undefined {
    return targets.get(makeKey(route, method));
  }

  return { addTarget, removeTarget, evaluate, evaluateAll, getTargets, getTarget };
}
