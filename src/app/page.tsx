import { dehydrate, HydrationBoundary, noop } from '@tanstack/react-query';
import { io } from 'next/cache';
import Link from 'next/link';
import { Suspense } from 'react';

import { TaskList } from './_components/task-list';
import {
  getNextTaskListCursor,
  TASK_LIST_INPUT,
} from '@/shared/tasks/task-list-query';
import { getQueryClient, trpc } from '@/server/adapters/trpc/server';

export default function HomePage() {
  return (
    <main>
      <div className="sticky top-0 z-10 -mx-4 mb-2 flex items-center justify-between gap-4 bg-zinc-50 px-4 py-4 dark:bg-zinc-950">
        <h1 className="page-title">Tasks</h1>
        <Link href="/tasks/new" className="button button-primary">
          New task
        </Link>
      </div>
      <Suspense fallback={<p className="text-muted">Loading tasks…</p>}>
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
