import { describe, expect, it } from 'vitest';

import { InMemoryTaskRepository } from '@/server/domains/task/repositories/in-memory-database-repository';
import { makeTask, STATUS_OUTSIDE_THE_SET } from '@/test/factories/make-task';

import { UpdateTask } from '.';

describe('UpdateTask', () => {
  it('updates a task', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(
      makeTask({ id: 'task-1', title: 'Write the README', description: null }),
    );
    const updateTask = new UpdateTask(repository);

    await updateTask.execute({
      id: 'task-1',
      title: 'Review the plan',
      description: 'Before coding',
      status: 'doing',
    });

    expect(
      (await repository.findExistingById('task-1')).toSnapshot(),
    ).toMatchObject({
      title: 'Review the plan',
      description: 'Before coding',
      status: 'doing',
    });
  });

  it('fails with TASK_NOT_FOUND for an unknown id and saves nothing', async () => {
    const repository = new InMemoryTaskRepository();
    const updateTask = new UpdateTask(repository);

    const promise = updateTask.execute({
      id: 'missing-id',
      title: 'Review the plan',
      status: 'todo',
    });

    await expect(promise).rejects.toMatchObject({ code: 'TASK_NOT_FOUND' });
    await expect(
      repository.findExistingById('missing-id'),
    ).rejects.toMatchObject({ code: 'TASK_NOT_FOUND' });
  });

  it('fails with TASK_TITLE_REQUIRED and keeps the stored task', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(
      makeTask({ id: 'task-1', title: 'Write the README' }),
    );
    const updateTask = new UpdateTask(repository);

    const promise = updateTask.execute({
      id: 'task-1',
      title: '   ',
      status: 'todo',
    });

    await expect(promise).rejects.toMatchObject({
      code: 'TASK_TITLE_REQUIRED',
    });
    expect((await repository.findExistingById('task-1')).title).toBe(
      'Write the README',
    );
  });

  it('fails with TASK_STATUS_INVALID and keeps the stored task', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(
      makeTask({ id: 'task-1', title: 'Write the README' }),
    );
    const updateTask = new UpdateTask(repository);

    const promise = updateTask.execute({
      id: 'task-1',
      title: 'Review the plan',
      status: STATUS_OUTSIDE_THE_SET,
    });

    await expect(promise).rejects.toMatchObject({
      code: 'TASK_STATUS_INVALID',
    });
    expect(
      (await repository.findExistingById('task-1')).toSnapshot(),
    ).toMatchObject({
      title: 'Write the README',
      status: 'todo',
    });
  });
});
