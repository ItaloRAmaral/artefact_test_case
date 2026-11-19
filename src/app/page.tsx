import { dehydrate, HydrationBoundary, noop } from '@tanstack/react-query';
import { io } from 'next/cache';
import { Suspense } from 'react';

import { TaskList } from '@/client/tasks/task-list';
import {
  getNextTaskListCursor,
  TASK_LIST_INPUT,
} from '@/client/tasks/task-list-query';
import { getQueryClient, trpc } from '@/server/adapters/trpc/server';

export default function HomePage() {
  return (
    <main>
      <h1>Tasks</h1>
      <Suspense fallback={<p>Loading tasks…</p>}>
        <TaskListSection />
      </Suspense>
    </main>
  );
}

async function TaskListSection() {
  // The in-memory store is invisible to Next.js, which would otherwise prerender the list
  // once at build time; io() keeps this section rendering per request (DECISIONS D-27).
  await io();

  const queryClient = getQueryClient();

  // The first page is fetched here and handed to the client cache, so the browser shows
  // it without requesting it again. A failed fetch is not dehydrated (only successful
  // queries are), so the client loads the list itself and shows the error (DECISIONS D-27).
  await queryClient
    .infiniteQuery(
      trpc.task.list.infiniteQueryOptions(TASK_LIST_INPUT, {
        getNextPageParam: getNextTaskListCursor,
      }),
    )
    .catch(noop);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TaskList />
    </HydrationBoundary>
  );
}
