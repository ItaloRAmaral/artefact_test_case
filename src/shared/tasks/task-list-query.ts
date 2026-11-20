import type { TaskListFilterInput } from './task-schemas';
import { taskListFilterSchema } from './task-schemas';

/**
 * Reads the list filter from URL search params, dropping the invalid keys.
 *
 * @param params - The URL search params.
 * @returns The filter.
 */
export function readTaskListFilter(
  params: Record<string, string | string[] | undefined>,
): TaskListFilterInput {
  const { shape } = taskListFilterSchema;

  return {
    titleContains: shape.titleContains.safeParse(params.titleContains).data,
    createdFrom: shape.createdFrom.safeParse(params.createdFrom).data,
    createdBefore: shape.createdBefore.safeParse(params.createdBefore).data,
    status: shape.status.safeParse(params.status).data,
  };
}

/**
 * Gets the cursor of the page after a given one.
 *
 * @param page - A page of the list.
 * @returns The next cursor, or `null` on the last page.
 */
export function getNextTaskListCursor(page: {
  nextCursor: string | null;
}): string | null {
  return page.nextCursor;
}
