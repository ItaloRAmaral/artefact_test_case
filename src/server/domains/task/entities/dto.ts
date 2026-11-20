import type { TaskStatus } from '@/shared/tasks/task-statuses';

export interface TaskSnapshot {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly status: TaskStatus;
  readonly createdAt: Date;
}

export interface TaskContent {
  readonly title: string;
  readonly description?: string | null;
}

export type TaskErrorCode =
  | 'TASK_NOT_FOUND'
  | 'TASK_TITLE_REQUIRED'
  | 'TASK_TITLE_TOO_LONG'
  | 'TASK_DESCRIPTION_TOO_LONG'
  | 'TASK_STATUS_INVALID'
  | 'TASK_CURSOR_INVALID'
  | 'TASK_STORAGE_FULL';
