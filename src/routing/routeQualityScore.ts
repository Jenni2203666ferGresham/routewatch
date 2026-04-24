/**
 * Route Quality Score
 *
 * Computes a composite quality score for a route based on latency,
 * error rate, throughput, and SLA compliance.
 */

export interface RouteQualityInput {
  route: string;
  method: string;
  avgLatencyMs: number;
  p99LatencyMs: number;
  errorRate: number;       // 0..1
  requestsPerMinute: number;
  slaBreachRate: number;   // 0..1
  latencyBudgetMs: number;
}

export interface RouteQualityResult {
  route: string;
  method: string;
  score: number;           // 0..100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  breakdown: {
    latencyScore: number;
    errorScore: number;
    throughputScore: number;
    slaScore: number;
  };
}

export function computeLatencyScore(avgMs: number, budgetMs: number): number {
  if (budgetMs <= 0) return 50;
  const ratio = avgMs / budgetMs;
  if (ratio <= 0.5) return 100;
  if (ratio <= 1.0) return Math.round(100 - (ratio - 0.5) * 100);
  return Math.max(0, Math.round(50 - (ratio - 1.0) * 50));
}

export function computeErrorScore(errorRate: number): number {
  if (errorRate <= 0.001) return 100;
  if (errorRate >= 0.2) return 0;
  return Math.round(100 - (errorRate / 0.2) * 100);
}

export function computeThroughputScore(rpm: number): number {
  if (rpm === 0) return 50;
  if (rpm >= 100) return 100;
  return Math.round((rpm / 100) * 100);
}

export function computeSlaScore(breachRate: number): number {
  if (breachRate <= 0) return 100;
  if (breachRate >= 0.1) return 0;
  return Math.round(100 - (breachRate / 0.1) * 100);
}

export function gradeFromScore(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

export function scoreRouteQuality(input: RouteQualityInput): RouteQualityResult {
  const latencyScore = computeLatencyScore(input.avgLatencyMs, input.latencyBudgetMs);
  const errorScore = computeErrorScore(input.errorRate);
  const throughputScore = computeThroughputScore(input.requestsPerMinute);
  const slaScore = computeSlaScore(input.slaBreachRate);

  const score = Math.round(
    latencyScore * 0.35 +
    errorScore   * 0.35 +
    throughputScore * 0.15 +
    slaScore     * 0.15
  );

  return {
    route: input.route,
    method: input.method,
    score,
    grade: gradeFromScore(score),
    breakdown: { latencyScore, errorScore, throughputScore, slaScore },
  };
}

export function rankByQuality(inputs: RouteQualityInput[]): RouteQualityResult[] {
  return inputs
    .map(scoreRouteQuality)
    .sort((a, b) => b.score - a.score);
}
