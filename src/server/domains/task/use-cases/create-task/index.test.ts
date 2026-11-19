import { describe, expect, it } from 'vitest';

import { InMemoryTaskRepository } from '@/server/domains/task/repositories/in-memory-database-repository';
import { FixedClock } from '@/test/fakes/fixed-clock';
import { SequentialIdGenerator } from '@/test/fakes/sequential-id-generator';

import { CreateTask } from '.';

const NOW = new Date('2026-11-19T12:00:00.000Z');

describe('CreateTask', () => {
  it('saves the created task', async () => {
    const repository = new InMemoryTaskRepository();
    const createTask = new CreateTask(
      repository,
      new FixedClock(NOW),
      new SequentialIdGenerator(),
    );

    await createTask.execute({
      title: 'Write the README',
      description: 'Explain how to run it',
    });

    expect((await repository.findExistingById('task-1')).toSnapshot()).toEqual({
      id: 'task-1',
      title: 'Write the README',
      description: 'Explain how to run it',
      createdAt: NOW,
    });
  });

  it('sets id and createdAt from the ports', async () => {
    const createTask = new CreateTask(
      new InMemoryTaskRepository(),
      new FixedClock(NOW),
      new SequentialIdGenerator(),
    );

    const task = await createTask.execute({ title: 'Write the README' });

    expect(task.toSnapshot()).toMatchObject({ id: 'task-1', createdAt: NOW });
  });

  it('fails with TASK_STORAGE_FULL when the storage is full', async () => {
    const createTask = new CreateTask(
      new InMemoryTaskRepository(1),
      new FixedClock(NOW),
      new SequentialIdGenerator(),
    );
    await createTask.execute({ title: 'Write the README' });

    const promise = createTask.execute({ title: 'Review the plan' });

    await expect(promise).rejects.toMatchObject({ code: 'TASK_STORAGE_FULL' });
  });

  it('fails with TASK_TITLE_REQUIRED and saves nothing', async () => {
    const repository = new InMemoryTaskRepository();
    const createTask = new CreateTask(
      repository,
      new FixedClock(NOW),
      new SequentialIdGenerator(),
    );

    const promise = createTask.execute({ title: '   ' });

    await expect(promise).rejects.toMatchObject({
      code: 'TASK_TITLE_REQUIRED',
    });
    expect(await repository.listAfter(null, 10)).toEqual([]);
  });
});
