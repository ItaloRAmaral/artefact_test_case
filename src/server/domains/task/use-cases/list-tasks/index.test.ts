import { describe, expect, it } from 'vitest';

import { InMemoryTaskRepository } from '@/server/domains/task/repositories/in-memory-database-repository';
import { makeTask } from '@/test/factories/make-task';

import { ListTasks } from '.';

const TASK_1 = makeTask({
  id: 'task-1',
  createdAt: new Date('2026-11-19T12:01:00.000Z'),
});
const TASK_2 = makeTask({
  id: 'task-2',
  createdAt: new Date('2026-11-19T12:02:00.000Z'),
});
const TASK_3 = makeTask({
  id: 'task-3',
  createdAt: new Date('2026-11-19T12:03:00.000Z'),
});
const TASK_4 = makeTask({
  id: 'task-4',
  createdAt: new Date('2026-11-19T12:04:00.000Z'),
});
const TASK_5 = makeTask({
  id: 'task-5',
  createdAt: new Date('2026-11-19T12:05:00.000Z'),
});

const SAME_TIME = new Date('2026-11-19T12:00:00.000Z');

describe('ListTasks', () => {
  it('returns an empty page when there are no tasks', async () => {
    const listTasks = new ListTasks(new InMemoryTaskRepository());

    const page = await listTasks.execute({ cursor: null, limit: 2 });

    expect(page).toEqual({ items: [], nextCursor: null });
  });

  it('returns the tasks newest first', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(TASK_1);
    await repository.save(TASK_2);
    const listTasks = new ListTasks(repository);

    const page = await listTasks.execute({ cursor: null, limit: 2 });

    expect(page.items.map((task) => task.id)).toEqual(['task-2', 'task-1']);
  });

  it('returns no next cursor when the tasks fit the limit exactly', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(TASK_1);
    await repository.save(TASK_2);
    const listTasks = new ListTasks(repository);

    const page = await listTasks.execute({ cursor: null, limit: 2 });

    expect(page.nextCursor).toBeNull();
  });

  it('returns only the first limit tasks when more remain', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(TASK_1);
    await repository.save(TASK_2);
    await repository.save(TASK_3);
    const listTasks = new ListTasks(repository);

    const page = await listTasks.execute({ cursor: null, limit: 2 });

    expect(page.items.map((task) => task.id)).toEqual(['task-3', 'task-2']);
  });

  it('returns a next cursor when more tasks remain', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(TASK_1);
    await repository.save(TASK_2);
    await repository.save(TASK_3);
    const listTasks = new ListTasks(repository);

    const page = await listTasks.execute({ cursor: null, limit: 2 });

    expect(page.nextCursor).toEqual(expect.any(String));
  });

  it('returns the remaining task on the last page', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(TASK_1);
    await repository.save(TASK_2);
    await repository.save(TASK_3);
    const listTasks = new ListTasks(repository);
    const firstPage = await listTasks.execute({ cursor: null, limit: 2 });

    const lastPage = await listTasks.execute({
      cursor: firstPage.nextCursor,
      limit: 2,
    });

    expect(lastPage).toEqual({ items: [TASK_1], nextCursor: null });
  });

  it('returns a middle page with a next cursor', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(TASK_1);
    await repository.save(TASK_2);
    await repository.save(TASK_3);
    await repository.save(TASK_4);
    await repository.save(TASK_5);
    const listTasks = new ListTasks(repository);
    const firstPage = await listTasks.execute({ cursor: null, limit: 2 });

    const middlePage = await listTasks.execute({
      cursor: firstPage.nextCursor,
      limit: 2,
    });

    expect(middlePage.items).toEqual([TASK_3, TASK_2]);
    expect(middlePage.nextCursor).toEqual(expect.any(String));
  });

  it('orders tasks created at the same time by id, highest first', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(makeTask({ id: 'task-a', createdAt: SAME_TIME }));
    await repository.save(makeTask({ id: 'task-c', createdAt: SAME_TIME }));
    await repository.save(makeTask({ id: 'task-b', createdAt: SAME_TIME }));
    const listTasks = new ListTasks(repository);

    const page = await listTasks.execute({ cursor: null, limit: 2 });

    expect(page.items.map((task) => task.id)).toEqual(['task-c', 'task-b']);
  });

  it('continues after tasks created at the same time without skipping or repeating one', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(makeTask({ id: 'task-a', createdAt: SAME_TIME }));
    await repository.save(makeTask({ id: 'task-c', createdAt: SAME_TIME }));
    await repository.save(makeTask({ id: 'task-b', createdAt: SAME_TIME }));
    const listTasks = new ListTasks(repository);
    const firstPage = await listTasks.execute({ cursor: null, limit: 2 });

    const lastPage = await listTasks.execute({
      cursor: firstPage.nextCursor,
      limit: 2,
    });

    expect(lastPage.items.map((task) => task.id)).toEqual(['task-a']);
  });

  it('continues right after the cursor position when its task was deleted', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(TASK_1);
    await repository.save(TASK_2);
    await repository.save(TASK_3);
    const listTasks = new ListTasks(repository);
    const firstPage = await listTasks.execute({ cursor: null, limit: 2 });
    await repository.delete('task-2');

    const lastPage = await listTasks.execute({
      cursor: firstPage.nextCursor,
      limit: 2,
    });

    expect(lastPage).toEqual({ items: [TASK_1], nextCursor: null });
  });

  it.each([
    { invalid: 'not base64', cursor: '%%%' },
    { invalid: 'only a date', cursor: 'MjAyNi0xMS0xOVQxMjowMDowMC4wMDBa' },
    {
      invalid: 'three parts',
      cursor: 'MjAyNi0xMS0xOVQxMjowMDowMC4wMDBafHRhc2stMXxleHRyYQ==',
    },
    { invalid: 'an invalid date', cursor: 'bm90LWEtZGF0ZXx0YXNrLTE=' },
    { invalid: 'an empty id', cursor: 'MjAyNi0xMS0xOVQxMjowMDowMC4wMDBafA==' },
  ])(
    'fails with TASK_CURSOR_INVALID for a cursor with $invalid',
    async ({ cursor }) => {
      const listTasks = new ListTasks(new InMemoryTaskRepository());

      const promise = listTasks.execute({ cursor, limit: 2 });

      await expect(promise).rejects.toMatchObject({
        code: 'TASK_CURSOR_INVALID',
      });
    },
  );
});
