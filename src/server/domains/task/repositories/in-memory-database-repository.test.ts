import { describe, expect, it } from 'vitest';

import type { TaskSnapshot } from '@/server/domains/task/entities/dto';
import { makeTask } from '@/test/factories/make-task';
import { makeTaskListFilter } from '@/test/factories/make-task-list-filter';

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

  it('shares tasks with another repository over the same store', async () => {
    const snapshots = new Map<string, TaskSnapshot>();
    await new InMemoryTaskRepository({ snapshots }).save(
      makeTask({ id: 'task-1' }),
    );
    const otherRepository = new InMemoryTaskRepository({ snapshots });

    const found = await otherRepository.findExistingById('task-1');

    expect(found.toSnapshot().id).toBe('task-1');
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
    const repository = new InMemoryTaskRepository({ capacity: 2 });
    await repository.save(makeTask({ id: 'task-1' }));
    await repository.save(makeTask({ id: 'task-2' }));

    const promise = repository.save(makeTask({ id: 'task-3' }));

    await expect(promise).rejects.toMatchObject({ code: 'TASK_STORAGE_FULL' });
  });

  it('still saves an existing task when the storage is full', async () => {
    const repository = new InMemoryTaskRepository({ capacity: 2 });
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
    const repository = new InMemoryTaskRepository({ capacity: 2 });
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

    const tasks = await repository.listAfter(null, 10, makeTaskListFilter());

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

    const tasks = await repository.listAfter(null, 10, makeTaskListFilter());

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

    const tasks = await repository.listAfter(null, 1, makeTaskListFilter());

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
      makeTaskListFilter(),
    );

    expect(tasks.map((task) => task.id)).toEqual(['task-b', 'task-a']);
  });
  it('lists only tasks whose title contains the search, ignoring case', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(
      makeTask({ id: 'task-1', title: 'Write the README' }),
    );
    await repository.save(makeTask({ id: 'task-2', title: 'Plan the week' }));
    await repository.save(makeTask({ id: 'task-3', title: 'Read me later' }));

    const tasks = await repository.listAfter(
      null,
      10,
      makeTaskListFilter({ titleContains: 'readme' }),
    );

    expect(tasks.map((task) => task.id)).toEqual(['task-1']);
  });

  it('lists tasks whose title matches the search, ignoring accents', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(makeTask({ id: 'task-1', title: 'Revisar a Ação' }));
    await repository.save(makeTask({ id: 'task-2', title: 'Plan the week' }));

    const tasks = await repository.listAfter(
      null,
      10,
      makeTaskListFilter({ titleContains: 'acao' }),
    );

    expect(tasks.map((task) => task.id)).toEqual(['task-1']);
  });

  it('finds an unaccented title with an accented search', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(makeTask({ id: 'task-1', title: 'Revisar a acao' }));
    await repository.save(makeTask({ id: 'task-2', title: 'Plan the week' }));

    const tasks = await repository.listAfter(
      null,
      10,
      makeTaskListFilter({ titleContains: 'Ação' }),
    );

    expect(tasks.map((task) => task.id)).toEqual(['task-1']);
  });

  it('includes a task created exactly at createdFrom', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(
      makeTask({
        id: 'task-before',
        createdAt: new Date('2026-11-20T02:59:59.999Z'),
      }),
    );
    await repository.save(
      makeTask({
        id: 'task-at',
        createdAt: new Date('2026-11-20T03:00:00.000Z'),
      }),
    );

    const tasks = await repository.listAfter(
      null,
      10,
      makeTaskListFilter({ createdFrom: new Date('2026-11-20T03:00:00.000Z') }),
    );

    expect(tasks.map((task) => task.id)).toEqual(['task-at']);
  });

  it('excludes a task created exactly at createdBefore', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(
      makeTask({
        id: 'task-just-before',
        createdAt: new Date('2026-11-21T02:59:59.999Z'),
      }),
    );
    await repository.save(
      makeTask({
        id: 'task-at',
        createdAt: new Date('2026-11-21T03:00:00.000Z'),
      }),
    );

    const tasks = await repository.listAfter(
      null,
      10,
      makeTaskListFilter({
        createdBefore: new Date('2026-11-21T03:00:00.000Z'),
      }),
    );

    expect(tasks.map((task) => task.id)).toEqual(['task-just-before']);
  });

  it('pages through filtered tasks after a position', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(
      makeTask({
        id: 'task-a',
        title: 'Write the README',
        createdAt: new Date('2026-11-19T10:00:00.000Z'),
      }),
    );
    await repository.save(
      makeTask({
        id: 'task-b',
        title: 'Plan the week',
        createdAt: new Date('2026-11-19T11:00:00.000Z'),
      }),
    );
    await repository.save(
      makeTask({
        id: 'task-c',
        title: 'Review the README',
        createdAt: new Date('2026-11-19T12:00:00.000Z'),
      }),
    );
    await repository.save(
      makeTask({
        id: 'task-d',
        title: 'Publish the README',
        createdAt: new Date('2026-11-19T13:00:00.000Z'),
      }),
    );

    const tasks = await repository.listAfter(
      { createdAt: new Date('2026-11-19T13:00:00.000Z'), id: 'task-d' },
      2,
      makeTaskListFilter({ titleContains: 'readme' }),
    );

    expect(tasks.map((task) => task.id)).toEqual(['task-c', 'task-a']);
  });
});
