import { MetricsStore } from '../metrics/MetricsStore';
import { evaluateAlerts } from './alertRules';
import { AlertConfig } from './alertConfig';
import { createNotifier, AlertNotification, NotifierOptions } from './alertNotifier';

export interface AlertPipelineOptions {
  store: MetricsStore;
  config: AlertConfig;
  notifier: NotifierOptions;
  intervalMs?: number;
}

export interface AlertPipeline {
  run(): AlertNotification[];
  start(): NodeJS.Timeout;
  stop(timer: NodeJS.Timeout): void;
}

export function createAlertPipeline(options: AlertPipelineOptions): AlertPipeline {
  const { store, config, notifier, intervalMs = 5000 } = options;
  const notify = createNotifier(notifier);

  function run(): AlertNotification[] {
    const snapshot = store.getAll();
    const triggered = evaluateAlerts(snapshot, config);

    const notifications: AlertNotification[] = triggered.map((t) => ({
      rule: t.name,
      route: t.route,
      message: t.message,
      triggeredAt: new Date(),
    }));

    notify(notifications);
    return notifications;
  }

  function start(): NodeJS.Timeout {
    return setInterval(() => {
      run();
    }, intervalMs);
  }

  function stop(timer: NodeJS.Timeout): void {
    clearInterval(timer);
  }

  return { run, start, stop };
}
