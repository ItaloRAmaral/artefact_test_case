import { z } from 'zod';

import {
  TASK_CURSOR_MAX_LENGTH,
  TASK_DESCRIPTION_MAX_LENGTH,
  TASK_ID_MAX_LENGTH,
  TASK_PAGE_SIZE_DEFAULT,
  TASK_PAGE_SIZE_MAX,
  TASK_TITLE_MAX_LENGTH,
} from './task-limits';

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

export const createTaskInputSchema = z.strictObject({ title, description });

export const updateTaskInputSchema = z.strictObject({ id, title, description });

export const taskIdInputSchema = z.strictObject({ id });

export const listTasksInputSchema = z.strictObject({
  cursor: z.string().max(TASK_CURSOR_MAX_LENGTH).nullish(),
  limit: z
    .number()
    .int()
    .min(1)
    .max(TASK_PAGE_SIZE_MAX)
    .default(TASK_PAGE_SIZE_DEFAULT),
  // tRPC's infinite query always sends it; the list only pages forward, so it is ignored (DECISIONS D-25).
  direction: z.enum(['forward', 'backward']).optional(),
});
