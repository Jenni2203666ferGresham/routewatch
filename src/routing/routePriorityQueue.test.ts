import { createRoutePriorityQueue, PriorityEntry } from './routePriorityQueue';

function makeEntry(route: string, method: string, score: number): PriorityEntry {
  return { route, method, score };
}

describe('createRoutePriorityQueue', () => {
  it('starts empty', () => {
    const q = createRoutePriorityQueue();
    expect(q.size()).toBe(0);
    expect(q.peek()).toBeUndefined();
  });

  it('inserts entries in descending score order', () => {
    const q = createRoutePriorityQueue();
    q.insert(makeEntry('/a', 'GET', 10));
    q.insert(makeEntry('/b', 'GET', 50));
    q.insert(makeEntry('/c', 'POST', 30));
    expect(q.size()).toBe(3);
    expect(q.peek()?.route).toBe('/b');
  });

  it('topN returns highest-scored entries', () => {
    const q = createRoutePriorityQueue();
    q.insert(makeEntry('/a', 'GET', 10));
    q.insert(makeEntry('/b', 'GET', 50));
    q.insert(makeEntry('/c', 'POST', 30));
    const top2 = q.topN(2);
    expect(top2).toHaveLength(2);
    expect(top2[0].route).toBe('/b');
    expect(top2[1].route).toBe('/c');
  });

  it('topN with n larger than size returns all', () => {
    const q = createRoutePriorityQueue();
    q.insert(makeEntry('/a', 'GET', 5));
    expect(q.topN(100)).toHaveLength(1);
  });

  it('removes an existing entry', () => {
    const q = createRoutePriorityQueue();
    q.insert(makeEntry('/a', 'GET', 20));
    q.insert(makeEntry('/b', 'DELETE', 80));
    const removed = q.remove('/b', 'DELETE');
    expect(removed).toBe(true);
    expect(q.size()).toBe(1);
    expect(q.peek()?.route).toBe('/a');
  });

  it('returns false when removing non-existent entry', () => {
    const q = createRoutePriorityQueue();
    expect(q.remove('/missing', 'GET')).toBe(false);
  });

  it('updates score on duplicate insert', () => {
    const q = createRoutePriorityQueue();
    q.insert(makeEntry('/a', 'GET', 10));
    q.insert(makeEntry('/b', 'GET', 5));
    // Re-insert /b with higher score
    q.insert(makeEntry('/b', 'GET', 99));
    expect(q.size()).toBe(2);
    expect(q.peek()?.route).toBe('/b');
    expect(q.peek()?.score).toBe(99);
  });

  it('drain returns all entries and clears queue', () => {
    const q = createRoutePriorityQueue();
    q.insert(makeEntry('/x', 'GET', 1));
    q.insert(makeEntry('/y', 'POST', 2));
    const drained = q.drain();
    expect(drained).toHaveLength(2);
    expect(q.size()).toBe(0);
  });

  it('clear empties the queue', () => {
    const q = createRoutePriorityQueue();
    q.insert(makeEntry('/z', 'GET', 7));
    q.clear();
    expect(q.size()).toBe(0);
    expect(q.peek()).toBeUndefined();
  });

  it('is case-insensitive for method keys', () => {
    const q = createRoutePriorityQueue();
    q.insert(makeEntry('/api', 'get', 15));
    const removed = q.remove('/api', 'GET');
    expect(removed).toBe(true);
    expect(q.size()).toBe(0);
  });
});
