import { taskListFilterSchema } from '@/shared/tasks/task-schemas';
import type { TaskStatus } from '@/shared/tasks/task-statuses';

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To do',
  doing: 'Doing',
  done: 'Done',
};

/**
 * Reads a form control's value as a task status.
 *
 * @param value - The control value.
 * @returns The status, or `undefined` when the value is not one.
 */
export function toTaskStatus(value: string): TaskStatus | undefined {
  return taskListFilterSchema.shape.status.safeParse(value).data;
}
