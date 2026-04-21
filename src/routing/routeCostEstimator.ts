export interface RouteCostInput {
  method: string;
  path: string;
  avgLatencyMs: number;
  callsPerMinute: number;
  errorRate: number;
  payloadSizeBytes?: number;
}

export interface RouteCostEstimate {
  method: string;
  path: string;
  computeScore: number;
  networkScore: number;
  reliabilityPenalty: number;
  totalCost: number;
}

const METHOD_WEIGHT: Record<string, number> = {
  GET: 1.0,
  POST: 1.4,
  PUT: 1.3,
  PATCH: 1.2,
  DELETE: 1.1,
  OPTIONS: 0.5,
  HEAD: 0.5,
};

export function estimateRouteCost(input: RouteCostInput): RouteCostEstimate {
  const methodWeight = METHOD_WEIGHT[input.method.toUpperCase()] ?? 1.0;
  const computeScore = (input.avgLatencyMs / 100) * methodWeight * Math.log1p(input.callsPerMinute);
  const payloadFactor = input.payloadSizeBytes ? input.payloadSizeBytes / 1024 : 0;
  const networkScore = payloadFactor * (input.callsPerMinute / 60);
  const reliabilityPenalty = input.errorRate * 10;
  const totalCost = computeScore + networkScore + reliabilityPenalty;

  return {
    method: input.method,
    path: input.path,
    computeScore: parseFloat(computeScore.toFixed(4)),
    networkScore: parseFloat(networkScore.toFixed(4)),
    reliabilityPenalty: parseFloat(reliabilityPenalty.toFixed(4)),
    totalCost: parseFloat(totalCost.toFixed(4)),
  };
}

export function rankByCost(estimates: RouteCostEstimate[]): RouteCostEstimate[] {
  return [...estimates].sort((a, b) => b.totalCost - a.totalCost);
}

export function createRouteCostEstimator() {
  const estimates = new Map<string, RouteCostEstimate>();

  function key(method: string, path: string): string {
    return `${method.toUpperCase()}:${path}`;
  }

  return {
    estimate(input: RouteCostInput): RouteCostEstimate {
      const result = estimateRouteCost(input);
      estimates.set(key(input.method, input.path), result);
      return result;
    },
    get(method: string, path: string): RouteCostEstimate | undefined {
      return estimates.get(key(method, path));
    },
    getAll(): RouteCostEstimate[] {
      return Array.from(estimates.values());
    },
    getRanked(): RouteCostEstimate[] {
      return rankByCost(Array.from(estimates.values()));
    },
    reset(): void {
      estimates.clear();
    },
  };
}
