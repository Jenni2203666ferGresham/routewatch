#!/usr/bin/env node
import { Command } from 'commander';
import { startLiveRender } from '../dashboard/render';
import { RouteMetrics } from '../metrics/RouteMetrics';
import { parseCliOptions, CliOptions } from './options';

const program = new Command();

program
  .name('routewatch')
  .description('Monitor and visualize Express/Fastify route usage and latency in real time')
  .version('0.1.0');

program
  .command('watch')
  .description('Start watching route metrics and render a live dashboard')
  .option('-p, --port <number>', 'Port to listen on for metrics (if using HTTP reporter)', '9091')
  .option('-i, --interval <ms>', 'Dashboard refresh interval in milliseconds', '1000')
  .option('-r, --routes <routes...>', 'Filter dashboard to specific route patterns')
  .option('--no-color', 'Disable colored output')
  .action((opts) => {
    const options = parseCliOptions(opts);
    const metrics = new RouteMetrics();

    console.log(`\nRouteWatch v0.1.0 — watching routes (refresh: ${options.interval}ms)\n`);

    startLiveRender(metrics, {
      intervalMs: options.interval,
      filterRoutes: options.routes,
      color: options.color,
    });
  });

program
  .command('snapshot')
  .description('Print a one-time snapshot of current route metrics')
  .action(() => {
    try {
      const metrics = new RouteMetrics();
      const { renderDashboard } = require('../dashboard/render');
      console.log(renderDashboard(metrics));
    } catch (err) {
      console.error('Error rendering snapshot:', err instanceof Error ? err.message : err);
      process.exit(1);
    }
  });

program.parse(process.argv);
