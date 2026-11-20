import { afterEach, describe, expect, it, vi } from 'vitest';

import { InMemoryTaskRepository } from '@/server/domains/task/repositories/in-memory-database-repository';
import { makeTaskListFilter } from '@/test/factories/make-task-list-filter';

import { CreateTask } from '.';

const NOW = new Date('2026-11-19T12:00:00.000Z');
const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('CreateTask', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('saves the created task', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    const repository = new InMemoryTaskRepository();
    const createTask = new CreateTask(repository);

    const task = await createTask.execute({
      title: 'Write the README',
      description: 'Explain how to run it',
    });

    expect((await repository.findExistingById(task.id)).toSnapshot()).toEqual({
      id: task.id,
      title: 'Write the README',
      description: 'Explain how to run it',
      createdAt: NOW,
    });
  });

  it('sets createdAt to the current time', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    const createTask = new CreateTask(new InMemoryTaskRepository());

    const task = await createTask.execute({ title: 'Write the README' });

    expect(task.createdAt).toEqual(NOW);
  });

  it('generates a UUID v4 as the id', async () => {
    const createTask = new CreateTask(new InMemoryTaskRepository());

    const task = await createTask.execute({ title: 'Write the README' });

    expect(task.id).toMatch(UUID_V4);
  });

  it('generates a different id for each task', async () => {
    const createTask = new CreateTask(new InMemoryTaskRepository());
    const firstTask = await createTask.execute({ title: 'Write the README' });

    const secondTask = await createTask.execute({ title: 'Review the plan' });

    expect(secondTask.id).not.toBe(firstTask.id);
  });

  it('fails with TASK_STORAGE_FULL when the storage is full', async () => {
    const createTask = new CreateTask(
      new InMemoryTaskRepository({ capacity: 1 }),
    );
    await createTask.execute({ title: 'Write the README' });

    const promise = createTask.execute({ title: 'Review the plan' });

    await expect(promise).rejects.toMatchObject({ code: 'TASK_STORAGE_FULL' });
  });

  it('fails with TASK_TITLE_REQUIRED and saves nothing', async () => {
    const repository = new InMemoryTaskRepository();
    const createTask = new CreateTask(repository);

    const promise = createTask.execute({ title: '   ' });

    await expect(promise).rejects.toMatchObject({
      code: 'TASK_TITLE_REQUIRED',
    });
    expect(await repository.listAfter(null, 10, makeTaskListFilter())).toEqual(
      [],
    );
  });
});
