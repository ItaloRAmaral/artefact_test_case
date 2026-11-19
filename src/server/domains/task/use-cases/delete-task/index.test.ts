import { describe, expect, it } from 'vitest';

import { InMemoryTaskRepository } from '@/server/domains/task/repositories/in-memory-database-repository';
import { makeTask } from '@/test/factories/make-task';

import { DeleteTask } from '.';

describe('DeleteTask', () => {
  it('deletes a task', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(makeTask({ id: 'task-1' }));
    const deleteTask = new DeleteTask(repository);

    await deleteTask.execute({ id: 'task-1' });

    await expect(repository.findExistingById('task-1')).rejects.toMatchObject({
      code: 'TASK_NOT_FOUND',
    });
  });

  it('fails with TASK_NOT_FOUND for an unknown id and keeps the others', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(makeTask({ id: 'task-1' }));
    const deleteTask = new DeleteTask(repository);

    const promise = deleteTask.execute({ id: 'missing-id' });

    await expect(promise).rejects.toMatchObject({ code: 'TASK_NOT_FOUND' });
    expect((await repository.findExistingById('task-1')).id).toBe('task-1');
  });
});
