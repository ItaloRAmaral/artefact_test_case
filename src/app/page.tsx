import { dehydrate, HydrationBoundary, noop } from '@tanstack/react-query';
import { io } from 'next/cache';
import Link from 'next/link';
import { Suspense } from 'react';

import { FilteredTaskList } from './_components/filtered-task-list';
import {
  getNextTaskListCursor,
  readTaskListFilter,
} from '@/shared/tasks/task-list-query';
import { getQueryClient, trpc } from '@/server/adapters/trpc/server';

export default function HomePage({ searchParams }: PageProps<'/'>) {
  return (
    <main>
      <Suspense
        fallback={
          <>
            <TaskListHeader />
            <p className="text-muted">Loading tasks…</p>
          </>
        }
      >
        <TaskListSection searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

function TaskListHeader() {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <h1 className="page-title">Tasks</h1>
      <Link href="/tasks/new" className="button button-primary">
        New task
      </Link>
    </div>
  );
}

async function TaskListSection({
  searchParams,
}: Pick<PageProps<'/'>, 'searchParams'>) {
  // The in-memory store is invisible to Next.js, which would otherwise prerender the list
  // once at build time; io() keeps this section rendering per request (DECISIONS D-27).
  await io();

  const filter = readTaskListFilter(await searchParams);
  const queryClient = getQueryClient();

  // The first page is fetched here and handed to the client cache, so the browser shows
  // it without requesting it again. A failed fetch is not dehydrated (only successful
  // queries are), so the client loads the list itself and shows the error (DECISIONS D-27).
  await queryClient
    .infiniteQuery(
      trpc.task.list.infiniteQueryOptions(filter, {
        getNextPageParam: getNextTaskListCursor,
      }),
    )
    .catch(noop);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <FilteredTaskList header={<TaskListHeader />} initialFilter={filter} />
    </HydrationBoundary>
  );
}
