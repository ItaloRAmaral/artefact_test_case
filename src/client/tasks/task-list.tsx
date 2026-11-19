'use client';

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useState } from 'react';

import { useTRPC } from '@/client/trpc/provider';
import {
  getNextTaskListCursor,
  TASK_LIST_INPUT,
} from '@/shared/tasks/task-list-query';

import type { ToastMessage } from './dto';
import { getErrorMessage } from './error-message';
import { TaskDate } from './task-date';
import { ToastRegion } from './toast';

export function TaskList() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<ToastMessage | null>(null);
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
  let content: ReactNode;

  function showToast(kind: ToastMessage['kind'], text: string) {
    setToast((current) => ({ id: (current?.id ?? 0) + 1, kind, text }));
  }

  if (list.isPending) {
    content = <p>Loading tasks…</p>;
  } else if (list.isLoadingError) {
    content = <p role="alert">{getErrorMessage(list.error)}</p>;
  } else if (tasks.length === 0) {
    content = <p>No tasks yet.</p>;
  } else {
    content = (
      <ul>
        {tasks.map((task) => (
          <li key={task.id}>
            <h2>{task.title}</h2>
            {task.description === null ? null : <p>{task.description}</p>}
            <TaskDate iso={task.createdAt} />
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
    );
  }

  return (
    <section aria-label="Tasks">
      {content}
      <ToastRegion toast={toast} />
    </section>
  );
}
