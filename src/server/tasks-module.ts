import 'server-only';

import type { TaskSnapshot } from '@/server/domains/task/entities/dto';
import type { TaskRepository } from '@/server/domains/task/repositories/database-repository';
import { InMemoryTaskRepository } from '@/server/domains/task/repositories/in-memory-database-repository';
import { ChangeTaskStatus } from '@/server/domains/task/use-cases/change-task-status';
import { CreateTask } from '@/server/domains/task/use-cases/create-task';
import { DeleteTask } from '@/server/domains/task/use-cases/delete-task';
import { GetTask } from '@/server/domains/task/use-cases/get-task';
import { ListTasks } from '@/server/domains/task/use-cases/list-tasks';
import { UpdateTask } from '@/server/domains/task/use-cases/update-task';

export function createTasksModule(repository: TaskRepository) {
  return {
    createTask: new CreateTask(repository),
    listTasks: new ListTasks(repository),
    getTask: new GetTask(repository),
    updateTask: new UpdateTask(repository),
    changeTaskStatus: new ChangeTaskStatus(repository),
    deleteTask: new DeleteTask(repository),
  };
}

// globalThis keeps the stored tasks across dev hot reloads (DECISIONS D-05) and across
// Next.js bundles: pages and the API route each load their own copy of the domain
// classes, so only plain data is shared, and each copy builds its own repository over it
// (an error class from another copy would fail instanceof, DECISIONS D-30).
const globalStore = globalThis as typeof globalThis & {
  taskSnapshots?: Map<string, TaskSnapshot>;
};

globalStore.taskSnapshots ??= new Map<string, TaskSnapshot>();

export const tasksModule = createTasksModule(
  new InMemoryTaskRepository({ snapshots: globalStore.taskSnapshots }),
);
