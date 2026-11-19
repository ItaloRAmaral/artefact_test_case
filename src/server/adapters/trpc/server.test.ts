import { expect, it } from 'vitest';

import {
  getNextTaskListCursor,
  TASK_LIST_INPUT,
} from '@/shared/tasks/task-list-query';
import { tasksModule } from '@/server/tasks-module';

import { getQueryClient, trpc } from './server';

it('prefetches the list from the shared module on the server', async () => {
  await tasksModule.createTask.execute({ title: 'Prefetched on the server' });

  const data = await getQueryClient().infiniteQuery(
    trpc.task.list.infiniteQueryOptions(TASK_LIST_INPUT, {
      getNextPageParam: getNextTaskListCursor,
    }),
  );

  expect(
    data.pages.flatMap((page) => page.items.map((task) => task.title)),
  ).toContain('Prefetched on the server');
});
