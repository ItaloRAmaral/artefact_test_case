import { Task } from '@/server/domains/task/entities/entity';
import type { TaskSnapshot } from '@/server/domains/task/entities/dto';

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
