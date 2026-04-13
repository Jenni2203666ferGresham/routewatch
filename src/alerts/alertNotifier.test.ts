import { createNotifier, formatAlertMessage, AlertNotification } from './alertNotifier';
import * as fs from 'fs';

jest.mock('fs');

const makeNotification = (overrides?: Partial<AlertNotification>): AlertNotification => ({
  rule: 'highLatency',
  route: 'GET /api/users',
  message: 'p95 latency 520ms exceeds threshold 500ms',
  triggeredAt: new Date('2024-01-01T12:00:00Z'),
  ...overrides,
});

describe('formatAlertMessage', () => {
  it('formats the alert message with timestamp', () => {
    const n = makeNotification();
    const msg = formatAlertMessage(n);
    expect(msg).toContain('[ALERT');
    expect(msg).toContain('highLatency');
    expect(msg).toContain('GET /api/users');
    expect(msg).toContain('p95 latency');
  });
});

describe('createNotifier - console channel', () => {
  it('calls console.warn for each notification', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const notify = createNotifier({ channel: 'console' });
    notify([makeNotification(), makeNotification({ route: 'POST /api/items' })]);
    expect(warnSpy).toHaveBeenCalledTimes(2);
    warnSpy.mockRestore();
  });

  it('does nothing when notifications array is empty', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const notify = createNotifier({ channel: 'console' });
    notify([]);
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

describe('createNotifier - file channel', () => {
  it('appends formatted message to the log file', () => {
    const notify = createNotifier({ channel: 'file', logFilePath: '/tmp/alerts.log' });
    notify([makeNotification()]);
    expect(fs.appendFileSync).toHaveBeenCalledWith(
      '/tmp/alerts.log',
      expect.stringContaining('highLatency'),
      'utf8'
    );
  });
});

describe('createNotifier - callback channel', () => {
  it('invokes the onAlert callback for each notification', () => {
    const onAlert = jest.fn();
    const notify = createNotifier({ channel: 'callback', onAlert });
    notify([makeNotification()]);
    expect(onAlert).toHaveBeenCalledTimes(1);
    expect(onAlert.mock.calls[0][0]).toMatchObject({
      route: 'GET /api/users',
      message: expect.stringContaining('latency'),
    });
  });
});
