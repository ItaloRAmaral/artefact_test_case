import type { TaskContent } from '@/server/domains/task/entities/dto';
import type { TaskStatus } from '@/shared/tasks/task-statuses';

export interface CreateTaskInput extends TaskContent {
  readonly status?: TaskStatus;
}
