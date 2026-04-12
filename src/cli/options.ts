export interface CliOptions {
  port: number;
  interval: number;
  routes: string[];
  color: boolean;
}

export interface RawCliOptions {
  port?: string;
  interval?: string;
  routes?: string[];
  color?: boolean;
}

export function parseCliOptions(raw: RawCliOptions): CliOptions {
  const port = parseInt(raw.port ?? '9091', 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid port: "${raw.port}". Must be a number between 1 and 65535.`);
  }

  const interval = parseInt(raw.interval ?? '1000', 10);
  if (isNaN(interval) || interval < 100) {
    throw new Error(`Invalid interval: "${raw.interval}". Must be a number >= 100ms.`);
  }

  const routes = Array.isArray(raw.routes) ? raw.routes : [];

  const color = raw.color !== false;

  return { port, interval, routes, color };
}
