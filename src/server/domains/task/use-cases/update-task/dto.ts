import type { TaskContent } from '@/server/domains/task/entities/dto';
import type { TaskStatus } from '@/shared/tasks/task-statuses';

export interface UpdateTaskInput extends TaskContent {
  readonly id: string;
  readonly status: TaskStatus;
}
