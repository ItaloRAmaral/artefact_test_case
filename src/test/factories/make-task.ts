import { Task } from '@/server/domains/task/entities/entity';
import type { TaskSnapshot } from '@/server/domains/task/entities/dto';
import type { TaskStatus } from '@/shared/tasks/task-statuses';

export const STATUS_OUTSIDE_THE_SET = 'archived' as TaskStatus;

/**
 * Creates a task snapshot with fixed data.
 *
 * @param overrides - The fields to change.
 * @returns The snapshot.
 */
export function makeTaskSnapshot(
  overrides: Partial<TaskSnapshot> = {},
): TaskSnapshot {
  return {
    id: 'task-1',
    title: 'Write the README',
    description: null,
    status: 'todo',
    createdAt: new Date('2026-11-19T12:00:00.000Z'),
    ...overrides,
  };
}

/**
 * Creates a task entity with fixed data.
 *
 * @param overrides - The fields to change.
 * @returns The task.
 */
export function makeTask(overrides: Partial<TaskSnapshot> = {}): Task {
  return Task.restore(makeTaskSnapshot(overrides));
}
