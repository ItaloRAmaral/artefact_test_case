import { describe, expect, it } from 'vitest';

import { makeTask } from '@/test/factories/make-task';

import { InMemoryTaskRepository } from './in-memory-database-repository';

describe('InMemoryTaskRepository', () => {
  it('finds an existing task by id', async () => {
    const repository = new InMemoryTaskRepository();
    const task = makeTask({ id: 'task-1', title: 'Write the README' });
    await repository.save(task);

    const found = await repository.findExistingById('task-1');

    expect(found.toSnapshot()).toEqual(task.toSnapshot());
  });

  it('fails with TASK_NOT_FOUND for an unknown id', async () => {
    const repository = new InMemoryTaskRepository();

    const promise = repository.findExistingById('missing-id');

    await expect(promise).rejects.toMatchObject({ code: 'TASK_NOT_FOUND' });
  });

  it('deletes a task', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(makeTask({ id: 'task-1' }));

    await repository.delete('task-1');

    await expect(repository.findExistingById('task-1')).rejects.toMatchObject({
      code: 'TASK_NOT_FOUND',
    });
  });

  it('returns copies, not stored state', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(
      makeTask({ id: 'task-1', title: 'Write the README' }),
    );
    const found = await repository.findExistingById('task-1');

    found.edit({ title: 'Changed without saving' });

    expect((await repository.findExistingById('task-1')).title).toBe(
      'Write the README',
    );
  });

  it('keeps the stored task when the saved instance is edited later', async () => {
    const repository = new InMemoryTaskRepository();
    const task = makeTask({ id: 'task-1', title: 'Write the README' });
    await repository.save(task);

    task.edit({ title: 'Changed without saving' });

    expect((await repository.findExistingById('task-1')).title).toBe(
      'Write the README',
    );
  });

  it('rejects a new task when the storage is full', async () => {
    const repository = new InMemoryTaskRepository(2);
    await repository.save(makeTask({ id: 'task-1' }));
    await repository.save(makeTask({ id: 'task-2' }));

    const promise = repository.save(makeTask({ id: 'task-3' }));

    await expect(promise).rejects.toMatchObject({ code: 'TASK_STORAGE_FULL' });
  });

  it('still saves an existing task when the storage is full', async () => {
    const repository = new InMemoryTaskRepository(2);
    await repository.save(
      makeTask({ id: 'task-1', title: 'Write the README' }),
    );
    await repository.save(makeTask({ id: 'task-2' }));

    await repository.save(makeTask({ id: 'task-1', title: 'Review the plan' }));

    expect((await repository.findExistingById('task-1')).title).toBe(
      'Review the plan',
    );
  });

  it('accepts a new task again after one is deleted', async () => {
    const repository = new InMemoryTaskRepository(2);
    await repository.save(makeTask({ id: 'task-1' }));
    await repository.save(makeTask({ id: 'task-2' }));
    await repository.delete('task-1');

    await repository.save(makeTask({ id: 'task-3' }));

    expect((await repository.findExistingById('task-3')).id).toBe('task-3');
  });

  it('lists newest first, breaking ties by id', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(
      makeTask({
        id: 'task-a',
        createdAt: new Date('2026-11-19T10:00:00.000Z'),
      }),
    );
    await repository.save(
      makeTask({
        id: 'task-b',
        createdAt: new Date('2026-11-19T12:00:00.000Z'),
      }),
    );
    await repository.save(
      makeTask({
        id: 'task-c',
        createdAt: new Date('2026-11-19T12:00:00.000Z'),
      }),
    );

    const tasks = await repository.listAfter(null, 10);

    expect(tasks.map((task) => task.id)).toEqual([
      'task-c',
      'task-b',
      'task-a',
    ]);
  });

  it('breaks ties by id whatever the order tasks were saved in', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(
      makeTask({
        id: 'task-c',
        createdAt: new Date('2026-11-19T12:00:00.000Z'),
      }),
    );
    await repository.save(
      makeTask({
        id: 'task-b',
        createdAt: new Date('2026-11-19T12:00:00.000Z'),
      }),
    );

    const tasks = await repository.listAfter(null, 10);

    expect(tasks.map((task) => task.id)).toEqual(['task-c', 'task-b']);
  });

  it('returns at most the requested number of tasks', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(
      makeTask({
        id: 'task-a',
        createdAt: new Date('2026-11-19T10:00:00.000Z'),
      }),
    );
    await repository.save(
      makeTask({
        id: 'task-b',
        createdAt: new Date('2026-11-19T11:00:00.000Z'),
      }),
    );

    const tasks = await repository.listAfter(null, 1);

    expect(tasks.map((task) => task.id)).toEqual(['task-b']);
  });

  it('lists only tasks after a position', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(
      makeTask({
        id: 'task-a',
        createdAt: new Date('2026-11-19T10:00:00.000Z'),
      }),
    );
    await repository.save(
      makeTask({
        id: 'task-b',
        createdAt: new Date('2026-11-19T12:00:00.000Z'),
      }),
    );
    await repository.save(
      makeTask({
        id: 'task-c',
        createdAt: new Date('2026-11-19T12:00:00.000Z'),
      }),
    );

    const tasks = await repository.listAfter(
      { createdAt: new Date('2026-11-19T12:00:00.000Z'), id: 'task-c' },
      10,
    );

    expect(tasks.map((task) => task.id)).toEqual(['task-b', 'task-a']);
  });
});
