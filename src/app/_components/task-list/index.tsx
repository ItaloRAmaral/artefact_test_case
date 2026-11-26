'use client';

import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';

import { useTRPC } from '@/client/trpc/provider';
import { getNextTaskListCursor } from '@/shared/tasks/task-list-query';
import type { TaskListFilterInput } from '@/shared/tasks/task-schemas';
import type { TaskStatus } from '@/shared/tasks/task-statuses';

import {
  getErrorMessage,
  isTemporaryError,
} from '@/client/shared/error-message';
import { TaskCard } from '../task-card';
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
            <TaskCard
              key={task.id}
              task={task}
              status={shownStatus(task)}
              isChangingStatus={changeStatus.isPending}
              onStatusChange={(status) => {
                changeStatus.mutate({ id: task.id, status });
              }}
              isDeleting={deleteTask.isPending}
              onDelete={() => {
                deleteTask.mutate({ id: task.id });
              }}
            />
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
