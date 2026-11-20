'use client';

import { useEffect, useId, useState, useSyncExternalStore } from 'react';

import { TASK_TITLE_MAX_LENGTH } from '@/shared/tasks/task-limits';
import type { TaskListFilterInput } from '@/shared/tasks/task-schemas';

import { SearchIcon } from '@/client/shared/icons';
import { StatusPicker } from '@/client/shared/status-picker';

const SEARCH_DEBOUNCE_MS = 300;

function subscribeToNothing(): () => void {
  return () => undefined;
}

// A day typed in a date input is a calendar day in the browser's zone: its first instant.
// setDate moves by calendar days, so a 23- or 25-hour day still counts as one (D-34).
function startOfLocalDay(day: string, daysLater: number): string {
  const date = new Date(`${day}T00:00`);

  date.setDate(date.getDate() + daysLater);

  return date.toISOString();
}

function toLocalDay(iso: string | undefined, msBefore: number): string {
  if (iso === undefined) {
    return '';
  }

  const date = new Date(new Date(iso).getTime() - msBefore);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${String(date.getFullYear())}-${month}-${day}`;
}

export function TaskFilters({
  filter,
  onChange,
}: {
  filter: TaskListFilterInput;
  onChange: (filter: TaskListFilterInput) => void;
}) {
  const searchId = useId();
  const fromId = useId();
  const toId = useId();
  const [search, setSearch] = useState(filter.titleContains ?? '');
  // The server does not know the browser's zone, so the days show only after hydration and
  // the server HTML matches the first client render (the D-14 pattern, as in TaskDate).
  const isHydrated = useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
  const fromDay = isHydrated ? toLocalDay(filter.createdFrom, 0) : '';
  // createdBefore is the first instant after the To day, so the day shown is 1 ms earlier.
  const toDay = isHydrated ? toLocalDay(filter.createdBefore, 1) : '';
  const hasFilter =
    search !== '' ||
    Object.values<string | undefined>(filter).some(
      (value) => value !== undefined,
    );

  useEffect(() => {
    const titleContains = search.trim() === '' ? undefined : search.trim();

    if (titleContains === filter.titleContains) {
      return;
    }

    const timeoutId = setTimeout(() => {
      onChange({ ...filter, titleContains });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [search, filter, onChange]);

  return (
    // The search and Clear share the first row; the status and the days share the second,
    // and wrap on a phone (DECISIONS D-37).
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <label htmlFor={searchId} className="sr-only">
            Search by title
          </label>
          <SearchIcon className="text-ink-muted pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <input
            id={searchId}
            type="search"
            className="field h-10 pl-9"
            placeholder="Search tasks…"
            maxLength={TASK_TITLE_MAX_LENGTH}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
            }}
          />
        </div>
        <button
          type="button"
          className="button text-ink-muted hover:text-ink h-10 px-2"
          disabled={!hasFilter}
          onClick={() => {
            setSearch('');
            onChange({});
          }}
        >
          Clear filters
        </button>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <StatusPicker
          value={filter.status}
          allLabel="All"
          onChange={(status) => {
            onChange({ ...filter, status });
          }}
        />
        <div className="grid w-full grid-cols-2 gap-2 sm:w-auto">
          <div>
            <label htmlFor={fromId} className="mb-1 block text-sm font-medium">
              Created from
            </label>
            <input
              id={fromId}
              type="date"
              className="field h-10 px-2 sm:w-38 sm:px-3"
              value={fromDay}
              max={toDay === '' ? undefined : toDay}
              onChange={(event) => {
                const day = event.target.value;

                onChange({
                  ...filter,
                  createdFrom: day === '' ? undefined : startOfLocalDay(day, 0),
                });
              }}
            />
          </div>
          <div>
            <label htmlFor={toId} className="mb-1 block text-sm font-medium">
              Created to
            </label>
            <input
              id={toId}
              type="date"
              className="field h-10 px-2 sm:w-38 sm:px-3"
              value={toDay}
              min={fromDay === '' ? undefined : fromDay}
              onChange={(event) => {
                const day = event.target.value;

                onChange({
                  ...filter,
                  createdBefore:
                    day === '' ? undefined : startOfLocalDay(day, 1),
                });
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
