import type { createTasksModule } from '@/server/tasks-module';

export interface TrpcContext {
  readonly tasks: ReturnType<typeof createTasksModule>;
}
