import { Task } from '@/server/tasks/domain/task';
import type { TaskSnapshot } from '@/server/tasks/domain/interfaces/task-snapshot';

export function makeTaskSnapshot(
  overrides: Partial<TaskSnapshot> = {},
): TaskSnapshot {
  return {
    id: 'task-1',
    title: 'Write the README',
    description: null,
    createdAt: new Date('2026-11-19T12:00:00.000Z'),
    ...overrides,
  };
}

export function makeTask(overrides: Partial<TaskSnapshot> = {}): Task {
  return Task.restore(makeTaskSnapshot(overrides));
}
