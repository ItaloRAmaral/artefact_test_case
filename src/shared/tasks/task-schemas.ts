import { z } from 'zod';

import {
  TASK_CURSOR_MAX_LENGTH,
  TASK_DESCRIPTION_MAX_LENGTH,
  TASK_ID_MAX_LENGTH,
  TASK_PAGE_SIZE_DEFAULT,
  TASK_PAGE_SIZE_MAX,
  TASK_TITLE_MAX_LENGTH,
} from './task-limits';
import { TASK_STATUSES } from './task-statuses';

const id = z.string().min(1).max(TASK_ID_MAX_LENGTH);

const title = z
  .string()
  .trim()
  .min(1, { error: 'Title is required' })
  .max(TASK_TITLE_MAX_LENGTH, {
    error: `Title must be at most ${String(TASK_TITLE_MAX_LENGTH)} characters`,
  });

const description = z
  .string()
  .trim()
  .max(TASK_DESCRIPTION_MAX_LENGTH, {
    error: `Description must be at most ${String(TASK_DESCRIPTION_MAX_LENGTH)} characters`,
  })
  .optional();

const status = z.enum(TASK_STATUSES);

export const createTaskInputSchema = z.strictObject({
  title,
  description,
  status: status.optional(),
});

export const updateTaskInputSchema = z.strictObject({
  id,
  title,
  description,
  status,
});

export const changeTaskStatusInputSchema = z.strictObject({ id, status });

export const taskIdInputSchema = z.strictObject({ id });

export const taskListFilterSchema = z.strictObject({
  titleContains: z.string().trim().min(1).max(TASK_TITLE_MAX_LENGTH).optional(),
  createdFrom: z.iso.datetime({ precision: 3 }).optional(),
  createdBefore: z.iso.datetime({ precision: 3 }).optional(),
  status: status.optional(),
});

export type TaskListFilterInput = z.infer<typeof taskListFilterSchema>;

export const listTasksInputSchema = taskListFilterSchema.extend({
  cursor: z.string().max(TASK_CURSOR_MAX_LENGTH).nullish(),
  limit: z
    .number()
    .int()
    .min(1)
    .max(TASK_PAGE_SIZE_MAX)
    .default(TASK_PAGE_SIZE_DEFAULT),
  direction: z.enum(['forward', 'backward']).optional(),
});
