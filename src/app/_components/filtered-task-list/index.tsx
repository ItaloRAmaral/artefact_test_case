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

export function FilteredTaskList({
  header,
  initialFilter,
}: {
  header: ReactNode;
  initialFilter: TaskListFilterInput;
}) {
  // The server reads the filter from the URL once; from then on the browser only writes
  // it. Reading it back would be wrong while a modal route shows its own URL over this
  // page, and replaceState keeps filter changes out of the history (DECISIONS D-34).
  const [filter, setFilter] = useState(initialFilter);
  const changeFilter = useCallback((next: TaskListFilterInput) => {
    setFilter(next);

    if (window.location.pathname === '/') {
      window.history.replaceState(null, '', toListUrl(next));
    }
  }, []);

  return (
    <>
      {/* The header and the filters stay on screen while the page scrolls (DECISIONS D-33). */}
      <div className="sticky top-0 z-10 -mx-4 mb-4 border-b border-zinc-200 bg-zinc-50 px-4 pb-4 dark:border-zinc-800 dark:bg-zinc-950">
        {header}
        <TaskFilters filter={filter} onChange={changeFilter} />
      </div>
      <TaskList filter={filter} />
    </>
  );
}
