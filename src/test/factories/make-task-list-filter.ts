import type { TaskListFilter } from '@/server/domains/task/repositories/dto';

/**
 * Creates a list filter with every key empty.
 *
 * @param overrides - The keys to set.
 * @returns The filter.
 */
export function makeTaskListFilter(
  overrides: Partial<TaskListFilter> = {},
): TaskListFilter {
  return {
    titleContains: null,
    createdFrom: null,
    createdBefore: null,
    status: null,
    ...overrides,
  };
}
