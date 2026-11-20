import { afterEach, describe, expect, it, vi } from 'vitest';

import { InMemoryTaskRepository } from '@/server/domains/task/repositories/in-memory-database-repository';
import { makeCaller } from '@/test/factories/make-caller';
import { makeTask } from '@/test/factories/make-task';
import { seedTasks } from '@/test/factories/seed-tasks';
import { untyped } from '@/test/untyped';

const NOW = new Date('2026-11-19T12:00:00.000Z');
const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('task router', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the task by id', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(makeTask());
    const caller = makeCaller(repository);

    const task = await caller.task.getById({ id: 'task-1' });

    expect(task).toEqual({
      id: 'task-1',
      title: 'Write the README',
      description: null,
      status: 'todo',
      createdAt: '2026-11-19T12:00:00.000Z',
    });
  });

  it('returns the created task', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    const caller = makeCaller();

    const task = await caller.task.create({ title: '  Write the README  ' });

    expect(task).toEqual({
      id: task.id,
      title: 'Write the README',
      description: null,
      status: 'todo',
      createdAt: '2026-11-19T12:00:00.000Z',
    });
    expect(task.id).toMatch(UUID_V4);
  });

  it('creates a task with the given status', async () => {
    const caller = makeCaller();

    const task = await caller.task.create({
      title: 'Write the README',
      status: 'doing',
    });

    expect(task.status).toBe('doing');
  });

  it('returns the updated task', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(makeTask());
    const caller = makeCaller(repository);

    const task = await caller.task.update({
      id: 'task-1',
      title: 'Review the plan',
      description: 'Check the edge cases',
      status: 'doing',
    });

    expect(task).toEqual({
      id: 'task-1',
      title: 'Review the plan',
      description: 'Check the edge cases',
      status: 'doing',
      createdAt: '2026-11-19T12:00:00.000Z',
    });
  });

  it('clears the description when update omits it', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(makeTask({ description: 'Old' }));
    const caller = makeCaller(repository);

    const task = await caller.task.update({
      id: 'task-1',
      title: 'Write the README',
      status: 'todo',
    });

    expect(task).toMatchObject({
      description: null,
      createdAt: '2026-11-19T12:00:00.000Z',
    });
  });

  it('lists tasks as task objects', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(makeTask());
    await repository.save(
      makeTask({
        id: 'task-2',
        title: 'Review the plan',
        createdAt: new Date('2026-11-19T12:01:00.000Z'),
      }),
    );
    const caller = makeCaller(repository);

    const page = await caller.task.list({});

    expect(page).toEqual({
      items: [
        {
          id: 'task-2',
          title: 'Review the plan',
          description: null,
          status: 'todo',
          createdAt: '2026-11-19T12:01:00.000Z',
        },
        {
          id: 'task-1',
          title: 'Write the README',
          description: null,
          status: 'todo',
          createdAt: '2026-11-19T12:00:00.000Z',
        },
      ],
      nextCursor: null,
    });
  });

  it('applies the default page size of 10', async () => {
    const repository = new InMemoryTaskRepository();
    await seedTasks(repository, 11);
    const caller = makeCaller(repository);

    const page = await caller.task.list({});

    expect(page.items).toHaveLength(10);
    expect(page.nextCursor).toEqual(expect.any(String));
  });

  it('accepts the direction sent by infinite queries', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(makeTask());
    const caller = makeCaller(repository);

    const page = await caller.task.list({ direction: 'forward' });

    expect(page.items).toHaveLength(1);
  });

  it('lists only tasks whose title contains the trimmed search', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(makeTask());
    await repository.save(makeTask({ id: 'task-2', title: 'Plan the week' }));
    const caller = makeCaller(repository);

    const page = await caller.task.list({ titleContains: '  readme ' });

    expect(page.items.map((task) => task.id)).toEqual(['task-1']);
  });

  it('lists only tasks created within the date range', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(
      makeTask({
        id: 'task-1',
        createdAt: new Date('2026-11-19T12:00:00.000Z'),
      }),
    );
    await repository.save(
      makeTask({
        id: 'task-2',
        createdAt: new Date('2026-11-20T12:00:00.000Z'),
      }),
    );
    await repository.save(
      makeTask({
        id: 'task-3',
        createdAt: new Date('2026-11-21T12:00:00.000Z'),
      }),
    );
    const caller = makeCaller(repository);

    const page = await caller.task.list({
      createdFrom: '2026-11-20T03:00:00.000Z',
      createdBefore: '2026-11-21T03:00:00.000Z',
    });

    expect(page.items.map((task) => task.id)).toEqual(['task-2']);
  });

  it('continues a filtered list with its cursor', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(makeTask());
    await repository.save(
      makeTask({
        id: 'task-2',
        title: 'Plan the week',
        createdAt: new Date('2026-11-19T12:01:00.000Z'),
      }),
    );
    await repository.save(
      makeTask({
        id: 'task-3',
        title: 'Review the README',
        createdAt: new Date('2026-11-19T12:02:00.000Z'),
      }),
    );
    const caller = makeCaller(repository);
    const firstPage = await caller.task.list({
      titleContains: 'readme',
      limit: 1,
    });

    const lastPage = await caller.task.list({
      titleContains: 'readme',
      limit: 1,
      cursor: firstPage.nextCursor,
    });

    expect(lastPage).toMatchObject({
      items: [{ id: 'task-1' }],
      nextCursor: null,
    });
  });

  it('lists only tasks in the given status', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(makeTask({ id: 'task-1', status: 'todo' }));
    await repository.save(
      makeTask({
        id: 'task-2',
        status: 'done',
        createdAt: new Date('2026-11-19T12:01:00.000Z'),
      }),
    );
    const caller = makeCaller(repository);

    const page = await caller.task.list({ status: 'done' });

    expect(page.items.map((task) => task.id)).toEqual(['task-2']);
  });

  it('returns the task with its new status', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(makeTask());
    const caller = makeCaller(repository);

    const task = await caller.task.changeStatus({
      id: 'task-1',
      status: 'done',
    });

    expect(task).toEqual({
      id: 'task-1',
      title: 'Write the README',
      description: null,
      status: 'done',
      createdAt: '2026-11-19T12:00:00.000Z',
    });
  });

  it('fails with NOT_FOUND for a missing task on changeStatus', async () => {
    const caller = makeCaller();

    const promise = caller.task.changeStatus({ id: 'missing', status: 'done' });

    await expect(promise).rejects.toMatchObject({
      code: 'NOT_FOUND',
      cause: { code: 'TASK_NOT_FOUND' },
    });
  });

  it('rejects an unknown key on changeStatus', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(makeTask());
    const caller = makeCaller(repository);
    const input = { id: 'task-1', status: 'done', title: 'Changed' };

    const promise = caller.task.changeStatus(untyped(input));

    await expect(promise).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    expect(
      (await repository.findExistingById('task-1')).toSnapshot(),
    ).toMatchObject({
      title: 'Write the README',
      status: 'todo',
    });
  });

  it.each([
    { invalid: 'an unknown status', status: 'archived' },
    { invalid: 'an empty status', status: '' },
  ])('rejects $invalid on changeStatus', async ({ status }) => {
    const caller = makeCaller();

    const promise = caller.task.changeStatus(untyped({ id: 'task-1', status }));

    await expect(promise).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      cause: { issues: [{ path: ['status'] }] },
    });
  });

  it('rejects an update without a status', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(makeTask());
    const caller = makeCaller(repository);
    const input = { id: 'task-1', title: 'Review the plan' };

    const promise = caller.task.update(untyped(input));

    await expect(promise).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      cause: { issues: [{ path: ['status'] }] },
    });
  });

  it('rejects an unknown status on list', async () => {
    const caller = makeCaller();
    const input = { status: 'archived' };

    const promise = caller.task.list(untyped(input));

    await expect(promise).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      cause: { issues: [{ path: ['status'] }] },
    });
  });

  it('returns the id of the deleted task', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(makeTask());
    const caller = makeCaller(repository);

    const result = await caller.task.delete({ id: 'task-1' });

    expect(result).toEqual({ id: 'task-1' });
  });

  it('removes the deleted task', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(makeTask());
    const caller = makeCaller(repository);

    await caller.task.delete({ id: 'task-1' });

    await expect(repository.findExistingById('task-1')).rejects.toMatchObject({
      code: 'TASK_NOT_FOUND',
    });
  });

  it.each([
    { key: 'id', input: { title: 'Write the README', id: 'task-9' } },
    {
      key: 'createdAt',
      input: {
        title: 'Write the README',
        createdAt: '2026-11-19T12:00:00.000Z',
      },
    },
  ])('rejects the unknown key $key on create', async ({ input }) => {
    const caller = makeCaller();

    const promise = caller.task.create(input);

    await expect(promise).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  it('rejects createdAt on update and keeps the stored task', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(makeTask());
    const caller = makeCaller(repository);
    const input = {
      id: 'task-1',
      title: 'Review the plan',
      status: 'todo',
      createdAt: '2020-01-01T00:00:00.000Z',
    };

    const promise = caller.task.update(untyped(input));

    await expect(promise).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    expect((await repository.findExistingById('task-1')).title).toBe(
      'Write the README',
    );
  });

  it('rejects an unknown key on getById', async () => {
    const caller = makeCaller();
    const input = { id: 'task-1', extra: true };

    const promise = caller.task.getById(input);

    await expect(promise).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  it('rejects an unknown key on delete', async () => {
    const caller = makeCaller();
    const input = { id: 'task-1', extra: true };

    const promise = caller.task.delete(input);

    await expect(promise).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  it('rejects an unknown key on list', async () => {
    const caller = makeCaller();
    const input = { limit: 10, extra: true };

    const promise = caller.task.list(input);

    await expect(promise).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  it.each([{ title: '' }, { title: '   ' }])(
    'rejects the blank title %j',
    async ({ title }) => {
      const caller = makeCaller();

      const promise = caller.task.create({ title });

      await expect(promise).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        cause: { issues: [{ path: ['title'] }] },
      });
    },
  );

  it.each([
    { field: 'title', input: { title: 'a'.repeat(121) } },
    {
      field: 'description',
      input: { title: 'Write the README', description: 'a'.repeat(1001) },
    },
  ])('rejects a $field over its limit on create', async ({ input }) => {
    const caller = makeCaller();

    const promise = caller.task.create(input);

    await expect(promise).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  it('rejects an id over its limit', async () => {
    const caller = makeCaller();

    const promise = caller.task.getById({ id: 'a'.repeat(37) });

    await expect(promise).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  it('rejects a cursor over its limit', async () => {
    const caller = makeCaller();

    const promise = caller.task.list({ cursor: 'a'.repeat(85) });

    await expect(promise).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  it.each([{ limit: 0 }, { limit: 51 }, { limit: 1.5 }])(
    'rejects the page size $limit',
    async ({ limit }) => {
      const caller = makeCaller();

      const promise = caller.task.list({ limit });

      await expect(promise).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    },
  );

  it.each([
    {
      invalid: 'an empty search',
      field: 'titleContains',
      input: { titleContains: '' },
    },
    {
      invalid: 'a blank search',
      field: 'titleContains',
      input: { titleContains: '   ' },
    },
    {
      invalid: 'a search over 120 characters',
      field: 'titleContains',
      input: { titleContains: 'a'.repeat(121) },
    },
    {
      invalid: 'a createdFrom that is not a date',
      field: 'createdFrom',
      input: { createdFrom: 'yesterday' },
    },
    {
      invalid: 'a createdFrom with an offset',
      field: 'createdFrom',
      input: { createdFrom: '2026-11-20T03:00:00-03:00' },
    },
    {
      invalid: 'a createdFrom with more than milliseconds',
      field: 'createdFrom',
      input: { createdFrom: '2026-11-20T03:00:00.000000000Z' },
    },
    {
      invalid: 'a createdBefore without a time',
      field: 'createdBefore',
      input: { createdBefore: '2026-11-20' },
    },
  ])('rejects $invalid on list', async ({ field, input }) => {
    const caller = makeCaller();

    const promise = caller.task.list(input);

    await expect(promise).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      cause: { issues: [{ path: [field] }] },
    });
  });

  it('fails with BAD_REQUEST for an undecodable cursor', async () => {
    const caller = makeCaller();

    const promise = caller.task.list({ cursor: '%%%' });

    await expect(promise).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      cause: { code: 'TASK_CURSOR_INVALID' },
    });
  });

  it('fails with NOT_FOUND for a missing task on getById', async () => {
    const caller = makeCaller();

    const promise = caller.task.getById({ id: 'missing' });

    await expect(promise).rejects.toMatchObject({
      code: 'NOT_FOUND',
      cause: { code: 'TASK_NOT_FOUND' },
    });
  });

  it('fails with NOT_FOUND for a missing task on update', async () => {
    const caller = makeCaller();

    const promise = caller.task.update({
      id: 'missing',
      title: 'Write the README',
      status: 'todo',
    });

    await expect(promise).rejects.toMatchObject({
      code: 'NOT_FOUND',
      cause: { code: 'TASK_NOT_FOUND' },
    });
  });

  it('fails with NOT_FOUND for a missing task on delete', async () => {
    const caller = makeCaller();

    const promise = caller.task.delete({ id: 'missing' });

    await expect(promise).rejects.toMatchObject({
      code: 'NOT_FOUND',
      cause: { code: 'TASK_NOT_FOUND' },
    });
  });

  it('fails with CONFLICT when the storage is full', async () => {
    const caller = makeCaller(new InMemoryTaskRepository({ capacity: 1 }));
    await caller.task.create({ title: 'Write the README' });

    const promise = caller.task.create({ title: 'Review the plan' });

    await expect(promise).rejects.toMatchObject({
      code: 'CONFLICT',
      cause: { code: 'TASK_STORAGE_FULL' },
    });
  });
});
