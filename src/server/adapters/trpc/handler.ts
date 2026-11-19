import 'server-only';

import type { TRPCError } from '@trpc/server';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';

import { tasksModule } from '@/server/tasks-module';

import { appRouter } from './app-router';

export function handleTrpcRequest(req: Request): Promise<Response> {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => ({ tasks: tasksModule }),
    // One call per request, so a single request cannot ask for an unbounded number of pages (DECISIONS D-25).
    allowBatching: false,
    onError: logUnexpectedError,
  });
}

export function logUnexpectedError({ error }: { error: TRPCError }): void {
  if (error.code !== 'INTERNAL_SERVER_ERROR') {
    return;
  }

  // eslint-disable-next-line no-console -- the client gets no detail of a bug (DECISIONS D-25), so the server log is its only trace
  console.error(error);
}
