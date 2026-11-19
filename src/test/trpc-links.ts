import type { TRPCLink } from '@trpc/client';
import { localLink, splitLink, TRPCClientError } from '@trpc/client';
import { observable } from '@trpc/server/observable';

import type { AppRouter } from '@/server/adapters/trpc/app-router';
import { appRouter } from '@/server/adapters/trpc/app-router';
import type { TaskRepository } from '@/server/domains/task/repositories/database-repository';
import { createTasksModule } from '@/server/tasks-module';

export function routerLink(repository: TaskRepository): TRPCLink<AppRouter> {
  return localLink({
    router: appRouter,
    createContext: () =>
      Promise.resolve({ tasks: createTasksModule(repository) }),
  });
}

export const failingLink: TRPCLink<AppRouter> = () => () =>
  observable((observer) => {
    observer.error(TRPCClientError.from(new Error('Network down')));
  });

export function failingAfterFirstCallLink(
  repository: TaskRepository,
): TRPCLink<AppRouter> {
  let callCount = 0;

  return splitLink({
    condition: () => {
      callCount += 1;

      return callCount === 1;
    },
    true: routerLink(repository),
    false: failingLink,
  });
}
