import type { TaskStatus } from '@/shared/tasks/task-statuses';

export interface TaskDto {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly status: TaskStatus;
  readonly createdAt: string;
}
