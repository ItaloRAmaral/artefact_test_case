// The statuses a task can be in, defined once for the entity, the Zod schemas and the UI
// (DECISIONS D-36). Any status can move to any other.
export const TASK_STATUSES = ['todo', 'doing', 'done'] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_STATUS_DEFAULT: TaskStatus = 'todo';
