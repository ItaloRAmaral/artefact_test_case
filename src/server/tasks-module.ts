import 'server-only';

import type { TaskRepository } from '@/server/domains/task/repositories/database-repository';
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
    deleteTask: new DeleteTask(repository),
  };
}
