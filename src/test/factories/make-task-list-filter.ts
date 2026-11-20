import type { TaskListFilter } from '@/server/domains/task/repositories/dto';

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
