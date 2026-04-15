import { createAnomalyNotifier, formatAnomalyMessage, toNotification, AnomalyNotification } from './anomalyNotifier';
import { AnomalyResult } from './anomalyDetector';

function makeAnomaly(overrides: Partial<AnomalyResult> = {}): AnomalyResult {
  return {
    route: 'GET /api/users',
    type: 'latency',
    message: 'Latency spike detected',
    value: 950,
    threshold: 300,
    ...overrides,
  };
}

describe('formatAnomalyMessage', () => {
  it('formats anomaly into readable string', () => {
    const msg = formatAnomalyMessage(makeAnomaly());
    expect(msg).toContain('[ANOMALY]');
    expect(msg).toContain('GET /api/users');
    expect(msg).toContain('latency');
    expect(msg).toContain('950.00');
    expect(msg).toContain('300.00');
  });
});

describe('toNotification', () => {
  it('converts anomaly to notification with severity high when ratio >= 3', () => {
    const n = toNotification(makeAnomaly({ value: 900, threshold: 300 }));
    expect(n.severity).toBe('high');
  });

  it('assigns medium severity when ratio is between 2 and 3', () => {
    const n = toNotification(makeAnomaly({ value: 600, threshold: 300 }));
    expect(n.severity).toBe('medium');
  });

  it('assigns low severity when ratio is less than 2', () => {
    const n = toNotification(makeAnomaly({ value: 400, threshold: 300 }));
    expect(n.severity).toBe('low');
  });

  it('includes a timestamp', () => {
    const before = Date.now();
    const n = toNotification(makeAnomaly());
    expect(n.timestamp).toBeGreaterThanOrEqual(before);
  });
});

describe('createAnomalyNotifier', () => {
  it('calls registered listener for each anomaly', () => {
    const notifier = createAnomalyNotifier();
    const received: AnomalyNotification[] = [];
    notifier.onNotify((n) => received.push(n));
    notifier.notify([makeAnomaly(), makeAnomaly({ route: 'POST /api/orders' })]);
    expect(received).toHaveLength(2);
    expect(received[0].route).toBe('GET /api/users');
    expect(received[1].route).toBe('POST /api/orders');
  });

  it('accepts a default notify function', () => {
    const calls: AnomalyNotification[] = [];
    const notifier = createAnomalyNotifier((n) => calls.push(n));
    notifier.notify([makeAnomaly()]);
    expect(calls).toHaveLength(1);
  });

  it('supports multiple listeners', () => {
    const notifier = createAnomalyNotifier();
    const a: string[] = [];
    const b: string[] = [];
    notifier.onNotify((n) => a.push(n.route));
    notifier.onNotify((n) => b.push(n.type));
    notifier.notify([makeAnomaly()]);
    expect(a).toEqual(['GET /api/users']);
    expect(b).toEqual(['latency']);
  });

  it('does not throw if a listener throws', () => {
    const notifier = createAnomalyNotifier();
    notifier.onNotify(() => { throw new Error('boom'); });
    expect(() => notifier.notify([makeAnomaly()])).not.toThrow();
  });

  it('does nothing when anomaly list is empty', () => {
    const notifier = createAnomalyNotifier();
    const received: AnomalyNotification[] = [];
    notifier.onNotify((n) => received.push(n));
    notifier.notify([]);
    expect(received).toHaveLength(0);
  });
});
