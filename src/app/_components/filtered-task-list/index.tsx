'use client';

import type { ReactNode } from 'react';
import { useCallback, useState } from 'react';

import type { TaskListFilterInput } from '@/shared/tasks/task-schemas';

import { TaskFilters } from '../task-filters';
import { TaskList } from '../task-list';

function toListUrl(filter: TaskListFilterInput): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries<string | undefined>(filter)) {
    if (value !== undefined) {
      params.set(key, value);
    }
  }

  const query = params.toString();

  return query === '' ? '/' : `?${query}`;
}

/**
 * Renders the sticky header with the filters, and the list for the current filter.
 *
 * @param props.header - The heading row shown above the filters.
 * @param props.initialFilter - The filter read from the URL.
 * @returns The header and the list.
 */
export function FilteredTaskList({
  header,
  initialFilter,
}: {
  header: ReactNode;
  initialFilter: TaskListFilterInput;
}) {
  const [filter, setFilter] = useState(initialFilter);
  const changeFilter = useCallback((next: TaskListFilterInput) => {
    setFilter(next);

    if (window.location.pathname === '/') {
      window.history.replaceState(null, '', toListUrl(next));
    }
  }, []);

  return (
    <>
      <div className="border-line bg-canvas sticky top-0 z-10 -mx-4 mb-5 border-b px-4 pb-4">
        {header}
        <TaskFilters filter={filter} onChange={changeFilter} />
      </div>
      <TaskList filter={filter} />
    </>
  );
}
