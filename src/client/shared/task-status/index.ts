import { taskListFilterSchema } from '@/shared/tasks/task-schemas';
import type { TaskStatus } from '@/shared/tasks/task-statuses';

// The one place where a status becomes text: the card, the form and the filter bar use it
// (DECISIONS D-36).
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To do',
  doing: 'Doing',
  done: 'Done',
};

// A <select>'s value is a plain string; the shared schema turns it into a status, or into
// undefined (the filter's "All"), without a cast.
export function toTaskStatus(value: string): TaskStatus | undefined {
  return taskListFilterSchema.shape.status.safeParse(value).data;
}
