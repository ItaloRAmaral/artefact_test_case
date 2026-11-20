import type { Task } from '@/server/domains/task/entities/entity';

import type { TaskListFilter, TaskPosition } from './dto';

export abstract class TaskRepository {
  abstract findExistingById(id: string): Promise<Task>;

  abstract save(task: Task): Promise<void>;

  abstract delete(id: string): Promise<void>;

  abstract listAfter(
    position: TaskPosition | null,
    count: number,
    filter: TaskListFilter,
  ): Promise<Task[]>;
}
