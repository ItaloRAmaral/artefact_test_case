import type { TaskStatus } from '@/shared/tasks/task-statuses';

export interface ChangeTaskStatusInput {
  readonly id: string;
  readonly status: TaskStatus;
}
