import { MetricsStore } from '../metrics/MetricsStore';
import { evaluateAlerts } from './alertRules';
import { AlertConfig } from './alertConfig';

export interface AlertEvent {
  route: string;
  rule: string;
  message: string;
  timestamp: Date;
  value: number;
  threshold: number;
}

export type AlertHandler = (event: AlertEvent) => void;

export class AlertManager {
  private handlers: AlertHandler[] = [];
  private firedAlerts: Set<string> = new Set();
  private config: AlertConfig;
  private cooldownMs: number;

  constructor(config: AlertConfig, cooldownMs = 60_000) {
    this.config = config;
    this.cooldownMs = cooldownMs;
  }

  onAlert(handler: AlertHandler): void {
    this.handlers.push(handler);
  }

  check(store: MetricsStore): AlertEvent[] {
    const triggered = evaluateAlerts(store, this.config);
    const now = Date.now();
    const newEvents: AlertEvent[] = [];

    for (const t of triggered) {
      const key = `${t.route}::${t.rule}`;
      if (!this.firedAlerts.has(key)) {
        const event: AlertEvent = {
          route: t.route,
          rule: t.rule,
          message: t.message,
          timestamp: new Date(),
          value: t.value,
          threshold: t.threshold,
        };
        newEvents.push(event);
        this.firedAlerts.add(key);
        setTimeout(() => this.firedAlerts.delete(key), this.cooldownMs);
        this.handlers.forEach((h) => h(event));
      }
    }

    return newEvents;
  }

  clearCooldowns(): void {
    this.firedAlerts.clear();
  }
}
