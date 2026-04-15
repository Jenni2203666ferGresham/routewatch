import { AnomalyResult } from './anomalyDetector';

export type AnomalySeverity = 'low' | 'medium' | 'high';

export interface AnomalyNotification {
  route: string;
  type: string;
  message: string;
  severity: AnomalySeverity;
  value: number;
  threshold: number;
  timestamp: number;
}

export type AnomalyNotifyFn = (notification: AnomalyNotification) => void;

function classifySeverity(value: number, threshold: number): AnomalySeverity {
  const ratio = value / threshold;
  if (ratio >= 3) return 'high';
  if (ratio >= 2) return 'medium';
  return 'low';
}

export function formatAnomalyMessage(anomaly: AnomalyResult): string {
  return `[ANOMALY] ${anomaly.route} — ${anomaly.type}: ${anomaly.message} (value=${anomaly.value.toFixed(2)}, threshold=${anomaly.threshold.toFixed(2)})`;
}

export function toNotification(anomaly: AnomalyResult): AnomalyNotification {
  return {
    route: anomaly.route,
    type: anomaly.type,
    message: anomaly.message,
    severity: classifySeverity(anomaly.value, anomaly.threshold),
    value: anomaly.value,
    threshold: anomaly.threshold,
    timestamp: Date.now(),
  };
}

export interface AnomalyNotifier {
  notify(anomalies: AnomalyResult[]): void;
  onNotify(fn: AnomalyNotifyFn): void;
}

export function createAnomalyNotifier(defaultFn?: AnomalyNotifyFn): AnomalyNotifier {
  const listeners: AnomalyNotifyFn[] = defaultFn ? [defaultFn] : [];

  return {
    onNotify(fn: AnomalyNotifyFn): void {
      listeners.push(fn);
    },

    notify(anomalies: AnomalyResult[]): void {
      for (const anomaly of anomalies) {
        const notification = toNotification(anomaly);
        for (const fn of listeners) {
          try {
            fn(notification);
          } catch {
            // swallow individual listener errors
          }
        }
      }
    },
  };
}
