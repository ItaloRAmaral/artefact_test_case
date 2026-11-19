import 'server-only';

import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query';
import { cache } from 'react';

import { tasksModule } from '@/server/tasks-module';
import { makeQueryClient } from '@/shared/trpc/query-client';

import { appRouter } from './app-router';

// One query client per server request: React's cache scopes it to the render, so
// requests never share prefetched data.
export const getQueryClient = cache(makeQueryClient);

export const trpc = createTRPCOptionsProxy({
  ctx: () => ({ tasks: tasksModule }),
  router: appRouter,
  queryClient: getQueryClient,
});
