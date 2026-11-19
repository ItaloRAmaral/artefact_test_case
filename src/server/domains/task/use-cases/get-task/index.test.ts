import { describe, expect, it } from 'vitest';

import { InMemoryTaskRepository } from '@/server/domains/task/repositories/in-memory-database-repository';
import { makeTask } from '@/test/factories/make-task';

import { GetTask } from '.';

describe('GetTask', () => {
  it('gets a task by id', async () => {
    const repository = new InMemoryTaskRepository();
    const stored = makeTask({ id: 'task-1', title: 'Write the README' });
    await repository.save(stored);
    const getTask = new GetTask(repository);

    const task = await getTask.execute({ id: 'task-1' });

    expect(task.toSnapshot()).toEqual(stored.toSnapshot());
  });

  it('fails with TASK_NOT_FOUND for an unknown id', async () => {
    const getTask = new GetTask(new InMemoryTaskRepository());

    const promise = getTask.execute({ id: 'missing-id' });

    await expect(promise).rejects.toMatchObject({ code: 'TASK_NOT_FOUND' });
  });
});
