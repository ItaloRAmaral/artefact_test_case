import type { Task } from '../../domain/task';
import type { TaskPosition } from './interfaces/task-position';

export abstract class TaskRepository {
  abstract findById(id: string): Promise<Task | null>;

  abstract save(task: Task): Promise<void>;

  abstract delete(id: string): Promise<void>;

  abstract listAfter(
    position: TaskPosition | null,
    count: number,
  ): Promise<Task[]>;
}
