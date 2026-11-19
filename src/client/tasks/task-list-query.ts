export const TASK_LIST_INPUT = {};

export function getNextTaskListCursor(page: {
  nextCursor: string | null;
}): string | null {
  return page.nextCursor;
}
