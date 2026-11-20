import type { TaskListFilterInput } from './task-schemas';
import { taskListFilterSchema } from './task-schemas';

// Each key is checked on its own, so a bad value in a hand-edited URL drops only that
// key and the page still renders (DECISIONS D-34).
export function readTaskListFilter(
  params: Record<string, string | string[] | undefined>,
): TaskListFilterInput {
  const { shape } = taskListFilterSchema;

  return {
    titleContains: shape.titleContains.safeParse(params.titleContains).data,
    createdFrom: shape.createdFrom.safeParse(params.createdFrom).data,
    createdBefore: shape.createdBefore.safeParse(params.createdBefore).data,
  };
}

export function getNextTaskListCursor(page: {
  nextCursor: string | null;
}): string | null {
  return page.nextCursor;
}
