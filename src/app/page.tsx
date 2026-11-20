import { dehydrate, HydrationBoundary, noop } from '@tanstack/react-query';
import { io } from 'next/cache';
import Link from 'next/link';
import { Suspense } from 'react';

import { FilteredTaskList } from './_components/filtered-task-list';
import { PlusIcon } from '@/client/shared/icons';
import {
  getNextTaskListCursor,
  readTaskListFilter,
} from '@/shared/tasks/task-list-query';
import { getQueryClient, trpc } from '@/server/adapters/trpc/server';

/**
 * Renders the task list page with the first page of tasks fetched on the server.
 *
 * @param props.searchParams - The URL search params, read as the list filter.
 * @returns The list page.
 */
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
    <div className="flex items-center justify-between gap-4 pt-4 pb-5">
      <h1 className="page-title">Tasks</h1>
      <Link href="/tasks/new" className="button button-primary">
        <PlusIcon />
        New task
      </Link>
    </div>
  );
}

async function TaskListSection({
  searchParams,
}: Pick<PageProps<'/'>, 'searchParams'>) {
  await io();

  const filter = readTaskListFilter(await searchParams);
  const queryClient = getQueryClient();

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
