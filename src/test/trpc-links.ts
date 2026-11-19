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

const neverSettlingLink: TRPCLink<AppRouter> = () => () =>
  observable(() => undefined);

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

export function pendingRefreshLink(
  repository: TaskRepository,
): TRPCLink<AppRouter> {
  let listCallCount = 0;

  return splitLink({
    condition: (op) => {
      if (op.path !== 'task.list') {
        return false;
      }

      listCallCount += 1;

      return listCallCount > 1;
    },
    true: neverSettlingLink,
    false: routerLink(repository),
  });
}

export function pendingProcedureLink(
  repository: TaskRepository,
  path: string,
): TRPCLink<AppRouter> {
  return splitLink({
    condition: (op) => op.path === path,
    true: neverSettlingLink,
    false: routerLink(repository),
  });
}

export function failingProcedureLink(
  repository: TaskRepository,
  path: string,
): TRPCLink<AppRouter> {
  return splitLink({
    condition: (op) => op.path === path,
    true: failingLink,
    false: routerLink(repository),
  });
}
