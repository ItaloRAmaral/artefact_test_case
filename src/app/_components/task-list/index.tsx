'use client';

import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';

import { useTRPC } from '@/client/trpc/provider';
import { getNextTaskListCursor } from '@/shared/tasks/task-list-query';
import type { TaskListFilterInput } from '@/shared/tasks/task-schemas';
import type { TaskStatus } from '@/shared/tasks/task-statuses';
import { TASK_STATUSES } from '@/shared/tasks/task-statuses';

import {
  getErrorMessage,
  isTemporaryError,
} from '@/client/shared/error-message';
import { TaskDate } from '../task-date';
import { TASK_STATUS_LABELS, toTaskStatus } from '@/client/shared/task-status';
import { useShowToast } from '@/client/shared/toast';

// Start loading the next page a little before the user reaches the end.
const LOAD_AHEAD_MARGIN = '200px';

const STATUS_PILL_COLORS: Record<TaskStatus, string> = {
  todo: 'border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200',
  doing:
    'border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300',
  done: 'border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
};

export function TaskList({ filter }: { filter: TaskListFilterInput }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const showToast = useShowToast();
  const list = useInfiniteQuery(
    trpc.task.list.infiniteQueryOptions(filter, {
      getNextPageParam: getNextTaskListCursor,
      // While a new filter loads, the previous results stay on screen, dimmed, instead of
      // a "Loading tasks…" flash on every search (DECISIONS D-34).
      placeholderData: keepPreviousData,
    }),
  );
  const deleteTask = useMutation(
    trpc.task.delete.mutationOptions({
      onSuccess: () => {
        showToast('success', 'Task deleted.');
      },
      onError: (error) => {
        showToast('error', getErrorMessage(error));
      },
      // Returning the promise keeps the mutation pending until the list has refetched, so
      // the buttons stay disabled while the deleted row is still on screen.
      onSettled: () =>
        queryClient.invalidateQueries(trpc.task.list.pathFilter()),
    }),
  );
  const changeStatus = useMutation(
    trpc.task.changeStatus.mutationOptions({
      // The edit form starts from the cached task: without the saved one there, reopening
      // Edit would show the old status and saving would bring it back (DECISIONS D-36).
      onSuccess: (task) => {
        queryClient.setQueryData(
          trpc.task.getById.queryKey({ id: task.id }),
          task,
        );
        showToast('success', 'Status updated.');
      },
      onError: (error) => {
        showToast('error', getErrorMessage(error));
      },
      // As with delete, the controls stay disabled until the list has refetched.
      onSettled: () =>
        queryClient.invalidateQueries(trpc.task.list.pathFilter()),
    }),
  );
  const tasks = list.data?.pages.flatMap((page) => page.items) ?? [];
  const isFiltered = Object.values<string | undefined>(filter).some(
    (value) => value !== undefined,
  );
  const pageCount = list.data?.pages.length ?? 0;
  const {
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isFetchNextPageError,
    fetchNextPage,
  } = list;
  const showsNextPageError = isFetchNextPageError && !isFetchingNextPage;
  // Not while any fetch runs: fetchNextPage cancels a running fetch, and a refetch after a
  // delete or a save would be lost, leaving a deleted task on screen. Not after a failed
  // page either: only Retry loads it again (DECISIONS D-31).
  const canLoadNextPage = hasNextPage && !isFetching && !isFetchNextPageError;
  const sentinelRef = useRef<HTMLDivElement>(null);
  let content: ReactNode;

  // While a change is saved, the pill shows the chosen status, not the stored one it would
  // otherwise snap back to until the refetch (the mutation's own state, not a copy).
  function shownStatus(task: { id: string; status: TaskStatus }): TaskStatus {
    return changeStatus.isPending && changeStatus.variables.id === task.id
      ? changeStatus.variables.status
      : task.status;
  }

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!canLoadNextPage || sentinel === null) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void fetchNextPage();
        }
      },
      { rootMargin: LOAD_AHEAD_MARGIN },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [canLoadNextPage, fetchNextPage]);

  if (list.isPending) {
    content = <p className="text-muted">Loading tasks…</p>;
  } else if (list.isLoadingError) {
    content = (
      <>
        <p role="alert" className="text-error">
          {getErrorMessage(list.error)}
        </p>
        {isTemporaryError(list.error) ? (
          <button
            type="button"
            className="button button-secondary mt-3"
            onClick={() => {
              void list.refetch();
            }}
          >
            Retry
          </button>
        ) : null}
      </>
    );
  } else if (tasks.length === 0) {
    content = (
      <p className="text-muted rounded-lg border border-dashed border-zinc-300 py-10 text-center dark:border-zinc-700">
        {isFiltered ? 'No tasks match the filters.' : 'No tasks yet.'}
      </p>
    );
  } else {
    content = (
      <>
        <ul
          className={`space-y-3 ${list.isPlaceholderData ? 'opacity-60' : ''}`}
        >
          {tasks.map((task) => (
            <li key={task.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-medium break-words">{task.title}</h2>
                <select
                  aria-label={`Status of ${task.title}`}
                  className={`shrink-0 cursor-pointer rounded-full border px-2.5 py-0.5 text-xs font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 aria-disabled:cursor-not-allowed aria-disabled:opacity-60 dark:focus-visible:outline-zinc-100 ${STATUS_PILL_COLORS[shownStatus(task)]}`}
                  value={shownStatus(task)}
                  // Not `disabled`: a focused control that becomes disabled drops the focus,
                  // and the arrow keys change a select at once, so a keyboard user would land
                  // back at the top of the page after each change (DECISIONS D-36).
                  aria-disabled={changeStatus.isPending}
                  onChange={(event) => {
                    const status = toTaskStatus(event.target.value);

                    if (!changeStatus.isPending && status !== undefined) {
                      changeStatus.mutate({ id: task.id, status });
                    }
                  }}
                >
                  {TASK_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {TASK_STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </div>
              {task.description === null ? null : (
                <p className="mt-1 text-sm break-words whitespace-pre-line text-zinc-600 dark:text-zinc-300">
                  {task.description}
                </p>
              )}
              <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                <TaskDate iso={task.createdAt} />
              </div>
              <div className="mt-3 flex gap-2">
                <Link
                  href={`/tasks/${task.id}/edit`}
                  aria-label={`Edit ${task.title}`}
                  className="button button-secondary"
                >
                  Edit
                </Link>
                <button
                  type="button"
                  className="button button-danger"
                  aria-label={`Delete ${task.title}`}
                  disabled={deleteTask.isPending}
                  onClick={() => {
                    deleteTask.mutate({ id: task.id });
                  }}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
        {isFetchingNextPage ? (
          <p className="text-muted mt-4 text-center">Loading more tasks…</p>
        ) : null}
        {showsNextPageError ? (
          <div className="mt-4 text-center">
            <p role="alert" className="text-error">
              {getErrorMessage(list.error)}
            </p>
            <button
              type="button"
              className="button button-secondary mt-2"
              onClick={() => {
                void fetchNextPage();
              }}
            >
              Retry
            </button>
          </div>
        ) : null}
        {!hasNextPage && pageCount > 1 ? (
          <p className="text-muted mt-4 text-center">No more tasks.</p>
        ) : null}
        <div ref={sentinelRef} />
      </>
    );
  }

  return (
    <section aria-label="Tasks" aria-busy={list.isPlaceholderData}>
      {content}
    </section>
  );
}
