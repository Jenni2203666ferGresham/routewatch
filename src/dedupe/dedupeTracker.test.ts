import { createDedupeTracker } from './dedupeTracker';

describe('createDedupeTracker', () => {
  it('records a new entry', () => {
    const tracker = createDedupeTracker();
    tracker.record('/api/users', 'GET', 200);
    const entry = tracker.getEntry('/api/users', 'GET', 200);
    expect(entry).toBeDefined();
    expect(entry!.count).toBe(1);
    expect(entry!.method).toBe('GET');
    expect(entry!.route).toBe('/api/users');
    expect(entry!.statusCode).toBe(200);
  });

  it('increments count on duplicate', () => {
    const tracker = createDedupeTracker();
    tracker.record('/api/items', 'POST', 201);
    tracker.record('/api/items', 'POST', 201);
    const entry = tracker.getEntry('/api/items', 'POST', 201);
    expect(entry!.count).toBe(2);
  });

  it('treats different status codes as distinct keys', () => {
    const tracker = createDedupeTracker();
    tracker.record('/api/x', 'GET', 200);
    tracker.record('/api/x', 'GET', 404);
    expect(tracker.getAll()).toHaveLength(2);
  });

  it('treats different methods as distinct keys', () => {
    const tracker = createDedupeTracker();
    tracker.record('/api/x', 'GET', 200);
    tracker.record('/api/x', 'POST', 200);
    expect(tracker.getAll()).toHaveLength(2);
  });

  it('normalizes method to uppercase', () => {
    const tracker = createDedupeTracker();
    tracker.record('/api/y', 'get', 200);
    const entry = tracker.getEntry('/api/y', 'get', 200);
    expect(entry!.method).toBe('GET');
  });

  it('getAll returns all entries', () => {
    const tracker = createDedupeTracker();
    tracker.record('/a', 'GET', 200);
    tracker.record('/b', 'GET', 200);
    expect(tracker.getAll()).toHaveLength(2);
  });

  it('reset clears all entries', () => {
    const tracker = createDedupeTracker();
    tracker.record('/a', 'GET', 200);
    tracker.reset();
    expect(tracker.getAll()).toHaveLength(0);
  });

  it('updates lastSeen on duplicate', async () => {
    const tracker = createDedupeTracker();
    tracker.record('/api/z', 'GET', 200);
    const first = tracker.getEntry('/api/z', 'GET', 200)!.firstSeen;
    await new Promise(r => setTimeout(r, 5));
    tracker.record('/api/z', 'GET', 200);
    const entry = tracker.getEntry('/api/z', 'GET', 200)!;
    expect(entry.lastSeen).toBeGreaterThanOrEqual(first);
  });
});
