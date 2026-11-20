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

/**
 * Creates the task use cases over a repository.
 *
 * @param repository - Where the tasks are stored.
 * @returns The use cases.
 */
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

const globalStore = globalThis as typeof globalThis & {
  taskSnapshots?: Map<string, TaskSnapshot>;
};

globalStore.taskSnapshots ??= new Map<string, TaskSnapshot>();

export const tasksModule = createTasksModule(
  new InMemoryTaskRepository({ snapshots: globalStore.taskSnapshots }),
);
