import { describe, expect, it } from 'vitest';

import { InMemoryTaskRepository } from '@/server/domains/task/repositories/in-memory-database-repository';
import { makeTask } from '@/test/factories/make-task';

import { ChangeTaskStatus } from '.';

describe('ChangeTaskStatus', () => {
  it('changes the status of a stored task', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(makeTask({ id: 'task-1' }));
    const changeTaskStatus = new ChangeTaskStatus(repository);

    await changeTaskStatus.execute({ id: 'task-1', status: 'done' });

    expect((await repository.findExistingById('task-1')).status).toBe('done');
  });

  it('returns the task with its new status', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(makeTask({ id: 'task-1' }));
    const changeTaskStatus = new ChangeTaskStatus(repository);

    const task = await changeTaskStatus.execute({
      id: 'task-1',
      status: 'doing',
    });

    expect(task.status).toBe('doing');
  });

  it('keeps the title and description', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(
      makeTask({ id: 'task-1', description: 'Explain how to run it' }),
    );
    const changeTaskStatus = new ChangeTaskStatus(repository);

    await changeTaskStatus.execute({ id: 'task-1', status: 'done' });

    expect(
      (await repository.findExistingById('task-1')).toSnapshot(),
    ).toMatchObject({
      title: 'Write the README',
      description: 'Explain how to run it',
    });
  });

  it('fails with TASK_NOT_FOUND for a missing task', async () => {
    const changeTaskStatus = new ChangeTaskStatus(new InMemoryTaskRepository());

    const promise = changeTaskStatus.execute({
      id: 'missing-id',
      status: 'done',
    });

    await expect(promise).rejects.toMatchObject({ code: 'TASK_NOT_FOUND' });
  });
});
