import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { RouteMetrics } from '../metrics/RouteMetrics';

export function createFastifyMiddleware(metrics: RouteMetrics) {
  return async function fastifyMiddleware(fastify: FastifyInstance): Promise<void> {
    fastify.addHook(
      'onRequest',
      async (request: FastifyRequest, _reply: FastifyReply) => {
        (request as any)._routewatchStart = Date.now();
      }
    );

    fastify.addHook(
      'onResponse',
      async (request: FastifyRequest, reply: FastifyReply) => {
        const start: number | undefined = (request as any)._routewatchStart;
        if (start === undefined) return;

        const latency = Date.now() - start;
        const method = request.method.toUpperCase();
        const routePattern =
          request.routerPath ||
          request.routeOptions?.url ||
          request.url.split('?')[0];

        const statusCode = reply.statusCode;

        metrics.record({
          method,
          path: routePattern,
          statusCode,
          latency,
          timestamp: new Date(),
        });
      }
    );
  };
}
