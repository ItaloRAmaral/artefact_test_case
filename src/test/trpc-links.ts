import type { OperationLink, TRPCLink } from '@trpc/client';
import { localLink, splitLink, TRPCClientError } from '@trpc/client';
import { observable } from '@trpc/server/observable';

import type { AppRouter } from '@/server/adapters/trpc/app-router';
import { appRouter } from '@/server/adapters/trpc/app-router';
import type { TaskRepository } from '@/server/domains/task/repositories/database-repository';
import { createTasksModule } from '@/server/tasks-module';

/**
 * Creates a link that calls the app router in process.
 *
 * @param repository - Where the tasks are stored.
 * @returns The link.
 */
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

/**
 * Creates a link that serves the first call and fails the others.
 *
 * @param repository - Where the tasks are stored.
 * @returns The link.
 */
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

/**
 * Creates a link that serves the first `task.list` call and never settles the next ones.
 *
 * @param repository - Where the tasks are stored.
 * @returns The link.
 */
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

/**
 * Creates a link that never settles the calls to one procedure.
 *
 * @param repository - Where the tasks are stored.
 * @param path - The procedure path.
 * @returns The link.
 */
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

/**
 * Creates a link that fails the calls to one procedure.
 *
 * @param repository - Where the tasks are stored.
 * @param path - The procedure path.
 * @returns The link.
 */
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

/**
 * Creates a link that serves, fails or hangs each call to one procedure, in order.
 *
 * @param repository - Where the tasks are stored.
 * @param path - The procedure path.
 * @param script - What to do with each call; calls past its end are served.
 * @returns The link.
 */
export function scriptedProcedureLink(
  repository: TaskRepository,
  path: string,
  script: readonly ('serve' | 'fail' | 'hang')[],
): TRPCLink<AppRouter> {
  let callCount = 0;

  return (runtime) => {
    const links: Record<'serve' | 'fail' | 'hang', OperationLink<AppRouter>> = {
      serve: routerLink(repository)(runtime),
      fail: failingLink(runtime),
      hang: neverSettlingLink(runtime),
    };

    return (options) => {
      if (options.op.path !== path) {
        return links.serve(options);
      }

      callCount += 1;

      return links[script[callCount - 1] ?? 'serve'](options);
    };
  };
}

/**
 * Wraps a link and counts its `task.list` calls.
 *
 * @param link - The link to wrap.
 * @returns The wrapped link and a function that reads the count.
 */
export function countingLink(link: TRPCLink<AppRouter>): {
  link: TRPCLink<AppRouter>;
  listCallCount: () => number;
} {
  let listCallCount = 0;

  return {
    link: (runtime) => {
      const operation = link(runtime);

      return (options) => {
        if (options.op.path === 'task.list') {
          listCallCount += 1;
        }

        return operation(options);
      };
    },
    listCallCount: () => listCallCount,
  };
}
