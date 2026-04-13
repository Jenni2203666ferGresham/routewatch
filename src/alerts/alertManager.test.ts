import { AlertManager, AlertEvent } from './alertManager';
import { MetricsStore } from '../metrics/MetricsStore';
import { buildAlertConfig } from './alertConfig';

function buildStoreWithHighLatency(): MetricsStore {
  const store = new MetricsStore();
  for (let i = 0; i < 5; i++) {
    store.record('GET /slow', 1200, false);
  }
  return store;
}

function buildStoreWithHighErrors(): MetricsStore {
  const store = new MetricsStore();
  store.record('POST /fail', 100, true);
  store.record('POST /fail', 100, true);
  store.record('POST /fail', 100, false);
  return store;
}

describe('AlertManager', () => {
  it('fires an alert when latency threshold is exceeded', () => {
    const config = buildAlertConfig({ maxAvgLatencyMs: 500 });
    const manager = new AlertManager(config, 0);
    const events: AlertEvent[] = [];
    manager.onAlert((e) => events.push(e));

    manager.check(buildStoreWithHighLatency());

    expect(events.length).toBeGreaterThan(0);
    expect(events[0].route).toBe('GET /slow');
    expect(events[0].rule).toMatch(/latency/i);
  });

  it('fires an alert when error rate threshold is exceeded', () => {
    const config = buildAlertConfig({ maxErrorRate: 0.5 });
    const manager = new AlertManager(config, 0);
    const events: AlertEvent[] = [];
    manager.onAlert((e) => events.push(e));

    manager.check(buildStoreWithHighErrors());

    expect(events.length).toBeGreaterThan(0);
    expect(events[0].route).toBe('POST /fail');
    expect(events[0].rule).toMatch(/error/i);
  });

  it('does not fire duplicate alerts within cooldown window', () => {
    const config = buildAlertConfig({ maxAvgLatencyMs: 500 });
    const manager = new AlertManager(config, 60_000);
    const events: AlertEvent[] = [];
    manager.onAlert((e) => events.push(e));

    const store = buildStoreWithHighLatency();
    manager.check(store);
    manager.check(store);

    expect(events.length).toBe(1);
  });

  it('re-fires alert after cooldown is cleared', () => {
    const config = buildAlertConfig({ maxAvgLatencyMs: 500 });
    const manager = new AlertManager(config, 60_000);
    const events: AlertEvent[] = [];
    manager.onAlert((e) => events.push(e));

    const store = buildStoreWithHighLatency();
    manager.check(store);
    manager.clearCooldowns();
    manager.check(store);

    expect(events.length).toBe(2);
  });

  it('returns fired events from check()', () => {
    const config = buildAlertConfig({ maxAvgLatencyMs: 500 });
    const manager = new AlertManager(config, 0);

    const result = manager.check(buildStoreWithHighLatency());

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('timestamp');
    expect(result[0]).toHaveProperty('value');
    expect(result[0]).toHaveProperty('threshold');
  });
});
