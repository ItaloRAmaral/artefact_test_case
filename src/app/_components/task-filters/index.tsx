'use client';

import { useEffect, useId, useState } from 'react';

import { TASK_TITLE_MAX_LENGTH } from '@/shared/tasks/task-limits';
import type { TaskListFilterInput } from '@/shared/tasks/task-schemas';

import { SearchIcon } from '@/client/shared/icons';
import { StatusPicker } from '@/client/shared/status-picker';
import { useIsHydrated } from '@/client/shared/use-is-hydrated';
import { DayField } from '../day-field';

const SEARCH_DEBOUNCE_MS = 300;

function startOfLocalDay(day: Date, daysLater: number): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate() + daysLater);
}

function toFilterDate(
  day: Date | undefined,
  daysLater: number,
): string | undefined {
  return day === undefined
    ? undefined
    : startOfLocalDay(day, daysLater).toISOString();
}

function toLocalDate(
  iso: string | undefined,
  msBefore: number,
): Date | undefined {
  return iso === undefined
    ? undefined
    : startOfLocalDay(new Date(new Date(iso).getTime() - msBefore), 0);
}

/**
 * Renders the title search, the creation-date range, the status and Clear.
 *
 * @param props.filter - The current filter.
 * @param props.onChange - Called with the new filter.
 * @returns The filter bar.
 */
export function TaskFilters({
  filter,
  onChange,
}: {
  filter: TaskListFilterInput;
  onChange: (filter: TaskListFilterInput) => void;
}) {
  const searchId = useId();
  const [search, setSearch] = useState(filter.titleContains ?? '');
  const isHydrated = useIsHydrated();
  const fromDate = isHydrated ? toLocalDate(filter.createdFrom, 0) : undefined;
  const toDate = isHydrated ? toLocalDate(filter.createdBefore, 1) : undefined;
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
          className="button button-secondary h-10 w-32"
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
          <DayField
            label="Created from"
            day={fromDate}
            latestDay={toDate}
            align="start"
            onDayChange={(day) => {
              onChange({ ...filter, createdFrom: toFilterDate(day, 0) });
            }}
          />
          <DayField
            label="Created to"
            day={toDate}
            earliestDay={fromDate}
            align="end"
            onDayChange={(day) => {
              onChange({ ...filter, createdBefore: toFilterDate(day, 1) });
            }}
          />
        </div>
      </div>
    </div>
  );
}
