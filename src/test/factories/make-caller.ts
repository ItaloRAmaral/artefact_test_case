import { appRouter } from '@/server/adapters/trpc/app-router';
import { createCallerFactory } from '@/server/adapters/trpc/init';
import type { TaskRepository } from '@/server/domains/task/repositories/database-repository';
import { InMemoryTaskRepository } from '@/server/domains/task/repositories/in-memory-database-repository';
import { createTasksModule } from '@/server/tasks-module';

export function makeCaller(
  repository: TaskRepository = new InMemoryTaskRepository(),
) {
  return createCallerFactory(appRouter)({
    tasks: createTasksModule(repository),
  });
}
