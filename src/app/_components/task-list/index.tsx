'use client';

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';

import { useTRPC } from '@/client/trpc/provider';
import {
  getNextTaskListCursor,
  TASK_LIST_INPUT,
} from '@/shared/tasks/task-list-query';

import {
  getErrorMessage,
  isTemporaryError,
} from '@/client/shared/error-message';
import { TaskDate } from '../task-date';
import { useShowToast } from '@/client/shared/toast';

// Start loading the next page a little before the user reaches the end.
const LOAD_AHEAD_MARGIN = '200px';

export function TaskList() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const showToast = useShowToast();
  const list = useInfiniteQuery(
    trpc.task.list.infiniteQueryOptions(TASK_LIST_INPUT, {
      getNextPageParam: getNextTaskListCursor,
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
  const tasks = list.data?.pages.flatMap((page) => page.items) ?? [];
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
        No tasks yet.
      </p>
    );
  } else {
    content = (
      <>
        <ul className="space-y-3">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <h2 className="font-medium break-words">{task.title}</h2>
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

  return <section aria-label="Tasks">{content}</section>;
}
