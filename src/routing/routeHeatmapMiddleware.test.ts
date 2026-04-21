import { createRouteHeatmapMiddleware } from './routeHeatmapMiddleware';
import { createRouteHeatmap } from './routeHeatmap';
import { EventEmitter } from 'events';

function makeReq(path = '/api/test', method = 'GET'): any {
  return { method, path, url: path, route: { path } };
}

function makeRes(): any {
  const emitter = new EventEmitter();
  return Object.assign(emitter, { statusCode: 200 });
}

describe('createRouteHeatmapMiddleware', () => {
  it('records a hit on response finish', () => {
    const heatmap = createRouteHeatmap();
    const mw = createRouteHeatmapMiddleware(heatmap);
    const req = makeReq('/api/items', 'GET');
    const res = makeRes();
    const next = jest.fn();

    mw.middleware(req, res, next);
    expect(next).toHaveBeenCalled();
    res.emit('finish');

    const entry = heatmap.getEntry('/api/items', 'GET');
    expect(entry).toBeDefined();
    expect(entry!.hits.reduce((a, b) => a + b, 0)).toBe(1);
  });

  it('does not record before finish', () => {
    const heatmap = createRouteHeatmap();
    const mw = createRouteHeatmapMiddleware(heatmap);
    const req = makeReq('/api/early', 'POST');
    const res = makeRes();
    const next = jest.fn();

    mw.middleware(req, res, next);
    expect(heatmap.getEntry('/api/early', 'POST')).toBeUndefined();
  });

  it('getHeatmap returns the underlying heatmap', () => {
    const heatmap = createRouteHeatmap();
    const mw = createRouteHeatmapMiddleware(heatmap);
    expect(mw.getHeatmap()).toBe(heatmap);
  });

  it('reset clears heatmap entries', () => {
    const heatmap = createRouteHeatmap();
    const mw = createRouteHeatmapMiddleware(heatmap);
    const req = makeReq('/api/reset', 'DELETE');
    const res = makeRes();
    mw.middleware(req, res, jest.fn());
    res.emit('finish');
    expect(heatmap.getAll()).toHaveLength(1);
    mw.reset();
    expect(heatmap.getAll()).toHaveLength(0);
  });

  it('falls back to req.url when route.path is absent', () => {
    const heatmap = createRouteHeatmap();
    const mw = createRouteHeatmapMiddleware(heatmap);
    const req = { method: 'GET', url: '/fallback' } as any;
    const res = makeRes();
    mw.middleware(req, res, jest.fn());
    res.emit('finish');
    expect(heatmap.getEntry('/fallback', 'GET')).toBeDefined();
  });
});
