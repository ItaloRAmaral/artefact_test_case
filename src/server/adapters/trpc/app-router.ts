import 'server-only';

import { taskRouter } from '@/server/adapters/controllers/task';

import { createTrpcRouter } from './init';

export const appRouter = createTrpcRouter({ task: taskRouter });

export type AppRouter = typeof appRouter;
