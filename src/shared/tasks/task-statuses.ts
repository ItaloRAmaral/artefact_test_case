export const TASK_STATUSES = ['todo', 'doing', 'done'] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_STATUS_DEFAULT: TaskStatus = 'todo';
