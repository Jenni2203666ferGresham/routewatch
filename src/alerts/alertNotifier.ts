import { AlertRule } from './alertRules';

export type NotificationChannel = 'console' | 'file' | 'callback';

export interface NotifierOptions {
  channel: NotificationChannel;
  logFilePath?: string;
  onAlert?: (alert: AlertRule & { triggeredAt: Date; message: string }) => void;
}

export interface AlertNotification {
  rule: string;
  route: string;
  message: string;
  triggeredAt: Date;
}

export function formatAlertMessage(notification: AlertNotification): string {
  const ts = notification.triggeredAt.toISOString();
  return `[ALERT ${ts}] ${notification.rule} on ${notification.route}: ${notification.message}`;
}

export function createNotifier(options: NotifierOptions) {
  return function notify(notifications: AlertNotification[]): void {
    if (notifications.length === 0) return;

    for (const n of notifications) {
      const msg = formatAlertMessage(n);

      if (options.channel === 'console') {
        console.warn(msg);
      } else if (options.channel === 'file' && options.logFilePath) {
        const fs = require('fs');
        fs.appendFileSync(options.logFilePath, msg + '\n', 'utf8');
      } else if (options.channel === 'callback' && options.onAlert) {
        options.onAlert({
          name: n.rule,
          route: n.route,
          triggeredAt: n.triggeredAt,
          message: n.message,
        } as any);
      }
    }
  };
}
