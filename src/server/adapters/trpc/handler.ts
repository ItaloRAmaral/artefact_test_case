import 'server-only';

import type { TRPCError } from '@trpc/server';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';

import { tasksModule } from '@/server/tasks-module';

import { appRouter } from './app-router';

/**
 * Handles a request to `/api/trpc`.
 *
 * @param req - The HTTP request.
 * @returns The HTTP response.
 */
export function handleTrpcRequest(req: Request): Promise<Response> {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => ({ tasks: tasksModule }),
    allowBatching: false,
    onError: logUnexpectedError,
  });
}

/**
 * Logs a server error that is not an expected one.
 *
 * @param options.error - The tRPC error.
 */
export function logUnexpectedError({ error }: { error: TRPCError }): void {
  if (error.code !== 'INTERNAL_SERVER_ERROR') {
    return;
  }

  // eslint-disable-next-line no-console
  console.error(error);
}
