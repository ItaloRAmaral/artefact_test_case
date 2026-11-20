'use client';

import { useEffect, useId, useState, useSyncExternalStore } from 'react';

import { TASK_TITLE_MAX_LENGTH } from '@/shared/tasks/task-limits';
import type { TaskListFilterInput } from '@/shared/tasks/task-schemas';
import { TASK_STATUSES } from '@/shared/tasks/task-statuses';

import { TASK_STATUS_LABELS, toTaskStatus } from '@/client/shared/task-status';

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
  const statusId = useId();
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
    // The search gets a row of its own, so it stays wide; on a phone the dates pair up and
    // stay readable, on a wider screen the dates, the status and Clear share one row.
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="col-span-2 sm:col-span-4">
        <label htmlFor={searchId} className="mb-1 block text-sm font-medium">
          Search by title
        </label>
        <input
          id={searchId}
          type="search"
          className="field h-10"
          maxLength={TASK_TITLE_MAX_LENGTH}
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
          }}
        />
      </div>
      <div>
        <label htmlFor={fromId} className="mb-1 block text-sm font-medium">
          Created from
        </label>
        <input
          id={fromId}
          type="date"
          className="field h-10"
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
          className="field h-10"
          value={toDay}
          min={fromDay === '' ? undefined : fromDay}
          onChange={(event) => {
            const day = event.target.value;

            onChange({
              ...filter,
              createdBefore: day === '' ? undefined : startOfLocalDay(day, 1),
            });
          }}
        />
      </div>
      <div>
        <label htmlFor={statusId} className="mb-1 block text-sm font-medium">
          Status
        </label>
        <select
          id={statusId}
          className="field h-10"
          value={filter.status ?? ''}
          onChange={(event) => {
            onChange({ ...filter, status: toTaskStatus(event.target.value) });
          }}
        >
          <option value="">All</option>
          {TASK_STATUSES.map((status) => (
            <option key={status} value={status}>
              {TASK_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        className="button button-secondary h-10 self-end"
        disabled={!hasFilter}
        onClick={() => {
          setSearch('');
          onChange({});
        }}
      >
        Clear filters
      </button>
    </div>
  );
}
