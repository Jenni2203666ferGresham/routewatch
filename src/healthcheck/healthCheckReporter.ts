import { HealthStatus } from './healthCheck';

const STATUS_ICONS: Record<HealthStatus['status'], string> = {
  healthy: '✅',
  degraded: '⚠️',
  unhealthy: '❌',
};

export function formatHealthStatus(status: HealthStatus): string {
  const icon = STATUS_ICONS[status.status];
  const uptimeSec = (status.uptime / 1000).toFixed(1);
  const errorPct = (status.errorRate * 100).toFixed(2);
  const latency = status.avgLatencyMs.toFixed(1);

  const lines = [
    `${icon} Status: ${status.status.toUpperCase()}`,
    `  Uptime:         ${uptimeSec}s`,
    `  Routes tracked: ${status.routeCount}`,
    `  Total requests: ${status.totalRequests}`,
    `  Avg latency:    ${latency}ms`,
    `  Error rate:     ${errorPct}%`,
    `  Checked at:     ${status.checkedAt}`,
  ];

  return lines.join('\n');
}

export function healthStatusToJson(status: HealthStatus): string {
  return JSON.stringify(status, null, 2);
}

export function isHealthy(status: HealthStatus): boolean {
  return status.status === 'healthy';
}

export function exitCodeForStatus(status: HealthStatus): number {
  switch (status.status) {
    case 'healthy': return 0;
    case 'degraded': return 1;
    case 'unhealthy': return 2;
  }
}
