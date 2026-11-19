import { describe, expect, it } from 'vitest';

import { makeTask, makeTaskSnapshot } from '@/test/factories/make-task';
import { catchError } from '@/test/catch-error';

import { Task } from './task';

const CREATED_AT = new Date('2026-11-19T12:00:00.000Z');

describe('Task.create', () => {
  it('creates a task with the given id, title, description and createdAt', () => {
    const props = {
      id: 'task-1',
      title: 'Write the README',
      description: 'Explain how to run it',
      createdAt: CREATED_AT,
    };

    const task = Task.create(props);

    expect(task.toSnapshot()).toEqual(props);
  });

  it.each([
    { case: 'empty', title: '' },
    { case: 'spaces only', title: '   ' },
  ])('rejects a blank title ($case)', ({ title }) => {
    const error = catchError(() =>
      Task.create({ id: 'task-1', title, createdAt: CREATED_AT }),
    );

    expect(error).toMatchObject({ code: 'TASK_TITLE_REQUIRED' });
  });

  it('trims the title', () => {
    const task = Task.create({
      id: 'task-1',
      title: '  Write the README  ',
      createdAt: CREATED_AT,
    });

    expect(task.title).toBe('Write the README');
  });

  it('trims the description', () => {
    const task = Task.create({
      id: 'task-1',
      title: 'Write the README',
      description: '  Explain how to run it  ',
      createdAt: CREATED_AT,
    });

    expect(task.description).toBe('Explain how to run it');
  });

  it('accepts a title of 120 characters', () => {
    const title = 'a'.repeat(120);

    const task = Task.create({ id: 'task-1', title, createdAt: CREATED_AT });

    expect(task.title).toBe(title);
  });

  it('accepts a 120-character title surrounded by spaces', () => {
    const title = 'a'.repeat(120);

    const task = Task.create({
      id: 'task-1',
      title: `  ${title}  `,
      createdAt: CREATED_AT,
    });

    expect(task.title).toBe(title);
  });

  it('rejects a title longer than 120 characters', () => {
    const title = 'a'.repeat(121);

    const error = catchError(() =>
      Task.create({ id: 'task-1', title, createdAt: CREATED_AT }),
    );

    expect(error).toMatchObject({ code: 'TASK_TITLE_TOO_LONG' });
  });

  it('accepts a description of 1000 characters', () => {
    const description = 'a'.repeat(1000);

    const task = Task.create({
      id: 'task-1',
      title: 'Write',
      description,
      createdAt: CREATED_AT,
    });

    expect(task.description).toBe(description);
  });

  it('rejects a description longer than 1000 characters', () => {
    const description = 'a'.repeat(1001);

    const error = catchError(() =>
      Task.create({
        id: 'task-1',
        title: 'Write',
        description,
        createdAt: CREATED_AT,
      }),
    );

    expect(error).toMatchObject({ code: 'TASK_DESCRIPTION_TOO_LONG' });
  });

  it.each([
    { case: 'missing', description: undefined },
    { case: 'empty', description: '' },
    { case: 'spaces only', description: '   ' },
  ])('stores the description as null when it is $case', ({ description }) => {
    const task = Task.create({
      id: 'task-1',
      title: 'Write',
      description,
      createdAt: CREATED_AT,
    });

    expect(task.description).toBeNull();
  });
});

describe('Task.edit', () => {
  it('edits title and description', () => {
    const task = makeTask();

    task.edit({ title: 'Review the plan', description: 'Before coding' });

    expect(task.toSnapshot()).toMatchObject({
      title: 'Review the plan',
      description: 'Before coding',
    });
  });

  it('rejects a blank title on edit', () => {
    const task = makeTask();

    const error = catchError(() => {
      task.edit({ title: '   ' });
    });

    expect(error).toMatchObject({ code: 'TASK_TITLE_REQUIRED' });
  });

  it('clears the description when an edit omits it', () => {
    const task = makeTask({ description: 'Explain how to run it' });

    task.edit({ title: 'Write the README' });

    expect(task.description).toBeNull();
  });

  it('stores a blank description as null on edit', () => {
    const task = makeTask({ description: 'Explain how to run it' });

    task.edit({ title: 'Write the README', description: '   ' });

    expect(task.description).toBeNull();
  });

  it('keeps the task unchanged when an edit fails', () => {
    const task = makeTask({
      title: 'Write the README',
      description: 'Explain how to run it',
    });

    catchError(() => {
      task.edit({ title: 'Review the plan', description: 'a'.repeat(1001) });
    });

    expect(task.toSnapshot()).toMatchObject({
      title: 'Write the README',
      description: 'Explain how to run it',
    });
  });

  it('keeps id and createdAt on edit', () => {
    const task = makeTask({ id: 'task-7', createdAt: CREATED_AT });

    task.edit({ title: 'Review the plan' });

    expect(task.toSnapshot()).toMatchObject({
      id: 'task-7',
      createdAt: CREATED_AT,
    });
  });
});

describe('Task createdAt copies', () => {
  it('does not let a changed createdAt from the getter alter the task', () => {
    const task = makeTask({ createdAt: CREATED_AT });

    task.createdAt.setUTCFullYear(2000);

    expect(task.toSnapshot().createdAt).toEqual(CREATED_AT);
  });

  it('does not let a changed createdAt from a snapshot alter the task', () => {
    const task = makeTask({ createdAt: CREATED_AT });

    task.toSnapshot().createdAt.setUTCFullYear(2000);

    expect(task.createdAt).toEqual(CREATED_AT);
  });
});

describe('Task.restore', () => {
  it('restores a task from its snapshot', () => {
    const snapshot = makeTaskSnapshot({ description: 'Explain how to run it' });

    const task = Task.restore(snapshot);

    expect(task.toSnapshot()).toEqual(snapshot);
  });
});
