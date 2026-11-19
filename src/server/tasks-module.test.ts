import { describe, expect, it } from 'vitest';

import { InMemoryTaskRepository } from '@/server/domains/task/repositories/in-memory-database-repository';
import { makeTask } from '@/test/factories/make-task';

import { createTasksModule } from './tasks-module';

describe('createTasksModule', () => {
  it('creates tasks in the given repository', async () => {
    const repository = new InMemoryTaskRepository();
    const tasks = createTasksModule(repository);

    const task = await tasks.createTask.execute({ title: 'Write the README' });

    expect((await repository.findExistingById(task.id)).title).toBe(
      'Write the README',
    );
  });

  it('lists tasks from the given repository', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(makeTask({ id: 'task-1' }));
    const tasks = createTasksModule(repository);

    const page = await tasks.listTasks.execute({ cursor: null, limit: 10 });

    expect(page.items.map((task) => task.id)).toEqual(['task-1']);
  });

  it('gets tasks from the given repository', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(makeTask({ id: 'task-1' }));
    const tasks = createTasksModule(repository);

    const task = await tasks.getTask.execute({ id: 'task-1' });

    expect(task.id).toBe('task-1');
  });

  it('updates tasks in the given repository', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(makeTask({ id: 'task-1' }));
    const tasks = createTasksModule(repository);

    await tasks.updateTask.execute({ id: 'task-1', title: 'Review the plan' });

    expect((await repository.findExistingById('task-1')).title).toBe(
      'Review the plan',
    );
  });

  it('deletes tasks from the given repository', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(makeTask({ id: 'task-1' }));
    const tasks = createTasksModule(repository);

    await tasks.deleteTask.execute({ id: 'task-1' });

    await expect(repository.findExistingById('task-1')).rejects.toMatchObject({
      code: 'TASK_NOT_FOUND',
    });
  });
});
