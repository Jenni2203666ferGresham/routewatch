export interface RouteScore {
  route: string;
  method: string;
  score: number;
  factors: {
    callCount: number;
    avgLatency: number;
    errorRate: number;
    recency: number;
  };
}

export interface ScorerWeights {
  callCount?: number;
  avgLatency?: number;
  errorRate?: number;
  recency?: number;
}

const DEFAULT_WEIGHTS: Required<ScorerWeights> = {
  callCount: 0.3,
  avgLatency: 0.3,
  errorRate: 0.2,
  recency: 0.2,
};

export interface ScorerInput {
  route: string;
  method: string;
  callCount: number;
  avgLatency: number;
  errorRate: number;
  lastSeenAt: number;
}

export function scoreRoute(
  input: ScorerInput,
  weights: ScorerWeights = {},
  now: number = Date.now()
): RouteScore {
  const w = { ...DEFAULT_WEIGHTS, ...weights };
  const normalizedLatency = Math.min(input.avgLatency / 5000, 1);
  const normalizedCalls = Math.min(input.callCount / 1000, 1);
  const ageMs = now - input.lastSeenAt;
  const recency = Math.max(0, 1 - ageMs / (1000 * 60 * 60));

  const score =
    w.callCount * normalizedCalls +
    w.avgLatency * normalizedLatency +
    w.errorRate * input.errorRate +
    w.recency * recency;

  return {
    route: input.route,
    method: input.method,
    score: parseFloat(score.toFixed(4)),
    factors: {
      callCount: normalizedCalls,
      avgLatency: normalizedLatency,
      errorRate: input.errorRate,
      recency,
    },
  };
}

export function createRouteScorer(weights?: ScorerWeights) {
  return {
    score(input: ScorerInput, now?: number): RouteScore {
      return scoreRoute(input, weights, now);
    },
    scoreAll(inputs: ScorerInput[], now?: number): RouteScore[] {
      return inputs
        .map((i) => scoreRoute(i, weights, now))
        .sort((a, b) => b.score - a.score);
    },
  };
}
