import { runReplayCommand } from './replayCommand';
import * as replayMetrics from './replayMetrics';
import * as render from '../dashboard/render';
import { MetricsStore } from '../metrics/MetricsStore';

jest.mock('./replayMetrics');
jest.mock('../dashboard/render');

const mockedReplay = replayMetrics as jest.Mocked<typeof replayMetrics>;
const mockedRender = render as jest.Mocked<typeof render>;

describe('runReplayCommand', () => {
  let consoleSpy: jest.SpyInstance;
  let store: MetricsStore;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    store = new MetricsStore();
    mockedReplay.replayMetrics.mockReturnValue(5);
    mockedRender.renderDashboard.mockReturnValue('--- dashboard ---');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('logs replayed entry count', () => {
    runReplayCommand({ file: 'metrics.json' }, store);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Replayed 5 entries'));
  });

  it('renders the dashboard by default', () => {
    runReplayCommand({ file: 'metrics.json' }, store);
    expect(mockedRender.renderDashboard).toHaveBeenCalledWith(store);
    expect(consoleSpy).toHaveBeenCalledWith('--- dashboard ---');
  });

  it('outputs JSON when output option is json', () => {
    runReplayCommand({ file: 'metrics.json', output: 'json' }, store);
    expect(mockedRender.renderDashboard).not.toHaveBeenCalled();
    const jsonCall = consoleSpy.mock.calls.find((c) => c[0].startsWith('{'));
    expect(jsonCall).toBeDefined();
  });

  it('exits on replay error', () => {
    mockedReplay.replayMetrics.mockImplementation(() => { throw new Error('bad file'); });
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => runReplayCommand({ file: 'bad.json' }, store)).toThrow('exit');
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('bad file'));
    exitSpy.mockRestore();
  });
});
