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
import { CalendarIcon, PencilIcon, TrashIcon } from '@/client/shared/icons';
import { TaskDate } from '../task-date';
import { TASK_STATUS_LABELS, toTaskStatus } from '@/client/shared/task-status';
import { useShowToast } from '@/client/shared/toast';

const LOAD_AHEAD_MARGIN = '200px';

/**
 * Renders the tasks that match a filter, loading more on scroll.
 *
 * @param props.filter - The list filter.
 * @returns The list section.
 */
export function TaskList({ filter }: { filter: TaskListFilterInput }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const showToast = useShowToast();
  const list = useInfiniteQuery(
    trpc.task.list.infiniteQueryOptions(filter, {
      getNextPageParam: getNextTaskListCursor,
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
      onSettled: () =>
        queryClient.invalidateQueries(trpc.task.list.pathFilter()),
    }),
  );
  const changeStatus = useMutation(
    trpc.task.changeStatus.mutationOptions({
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
  const canLoadNextPage = hasNextPage && !isFetching && !isFetchNextPageError;
  const sentinelRef = useRef<HTMLDivElement>(null);
  let content: ReactNode;

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
      <p className="text-muted border-line rounded-xl border border-dashed py-12 text-center">
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
            <li
              key={task.id}
              data-status={shownStatus(task)}
              className="border-line rounded-xl border border-l-4 border-l-(--status) bg-(--status-tint) py-4 pr-3 pl-5 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <h2
                  className={`pt-0.5 text-[1.0625rem] leading-snug font-semibold break-words ${shownStatus(task) === 'done' ? 'text-ink-muted' : ''}`}
                >
                  {task.title}
                </h2>
                <span className="border-line bg-surface has-focus-visible:outline-accent relative inline-flex shrink-0 items-center gap-1.5 rounded-full border py-1 pr-2 pl-2.5 text-xs font-semibold text-(--status-ink) has-aria-disabled:opacity-60 has-focus-visible:outline-2 has-focus-visible:outline-offset-2">
                  <span
                    aria-hidden
                    className="size-2 rounded-full bg-(--status)"
                  />
                  <span
                    aria-hidden
                    className="block [text-box:trim-both_cap_alphabetic]"
                  >
                    {TASK_STATUS_LABELS[shownStatus(task)]}
                  </span>
                  <svg
                    aria-hidden
                    viewBox="0 0 12 12"
                    className="size-3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 4.5 6 7.5 9 4.5" />
                  </svg>
                  <select
                    aria-label={`Status of ${task.title}`}
                    className="absolute inset-0 cursor-pointer appearance-none rounded-full opacity-0 aria-disabled:cursor-not-allowed"
                    value={shownStatus(task)}
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
                </span>
              </div>
              {task.description === null ? null : (
                <p className="text-ink-muted mt-1 pr-2 text-sm break-words whitespace-pre-line">
                  {task.description}
                </p>
              )}
              <div className="mt-1.5 -mb-2 flex items-center justify-between gap-3">
                <span className="text-ink-muted inline-flex items-center gap-1.5 text-xs">
                  <CalendarIcon className="size-3.5" />
                  <TaskDate iso={task.createdAt} />
                </span>
                <div className="flex gap-0.5">
                  <Link
                    href={`/tasks/${task.id}/edit`}
                    aria-label={`Edit ${task.title}`}
                    title="Edit"
                    className="icon-button"
                  >
                    <PencilIcon />
                  </Link>
                  <button
                    type="button"
                    className="icon-button hover:bg-danger/10 hover:text-danger"
                    aria-label={`Delete ${task.title}`}
                    title="Delete"
                    disabled={deleteTask.isPending}
                    onClick={() => {
                      deleteTask.mutate({ id: task.id });
                    }}
                  >
                    <TrashIcon />
                  </button>
                </div>
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
