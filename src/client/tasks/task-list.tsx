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

import { getErrorMessage } from './error-message';
import { TaskDate } from './task-date';
import { useShowToast } from './toast';

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
    content = <p>Loading tasks…</p>;
  } else if (list.isLoadingError) {
    content = <p role="alert">{getErrorMessage(list.error)}</p>;
  } else if (tasks.length === 0) {
    content = <p>No tasks yet.</p>;
  } else {
    content = (
      <>
        <ul>
          {tasks.map((task) => (
            <li key={task.id}>
              <h2>{task.title}</h2>
              {task.description === null ? null : <p>{task.description}</p>}
              <TaskDate iso={task.createdAt} />
              <Link
                href={`/tasks/${task.id}/edit`}
                aria-label={`Edit ${task.title}`}
              >
                Edit
              </Link>
              <button
                type="button"
                aria-label={`Delete ${task.title}`}
                disabled={deleteTask.isPending}
                onClick={() => {
                  deleteTask.mutate({ id: task.id });
                }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
        {isFetchingNextPage ? <p>Loading more tasks…</p> : null}
        {showsNextPageError ? (
          <>
            <p role="alert">{getErrorMessage(list.error)}</p>
            <button
              type="button"
              onClick={() => {
                void fetchNextPage();
              }}
            >
              Retry
            </button>
          </>
        ) : null}
        {!hasNextPage && pageCount > 1 ? <p>No more tasks.</p> : null}
        <div ref={sentinelRef} />
      </>
    );
  }

  return <section aria-label="Tasks">{content}</section>;
}
