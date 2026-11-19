'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { useTRPC } from '@/client/trpc/provider';

import { getErrorMessage } from './error-message';
import { TaskDate } from './task-date';
import { getNextTaskListCursor, TASK_LIST_INPUT } from './task-list-query';

export function TaskList() {
  const trpc = useTRPC();
  const list = useInfiniteQuery(
    trpc.task.list.infiniteQueryOptions(TASK_LIST_INPUT, {
      getNextPageParam: getNextTaskListCursor,
    }),
  );
  const tasks = list.data?.pages.flatMap((page) => page.items) ?? [];
  let content: ReactNode;

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
          </li>
        ))}
      </ul>
    );
  }

  return <section aria-label="Tasks">{content}</section>;
}
