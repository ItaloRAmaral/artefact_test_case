import { Task } from '@/server/domains/task/entities/entity';
import type { TaskSnapshot } from '@/server/domains/task/entities/dto';
import type { TaskStatus } from '@/shared/tasks/task-statuses';

// A value outside TASK_STATUSES, as a caller that bypassed the schema would send; the cast
// is what lets a test reach the entity's own check.
export const STATUS_OUTSIDE_THE_SET = 'archived' as TaskStatus;

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

export function makeTask(overrides: Partial<TaskSnapshot> = {}): Task {
  return Task.restore(makeTaskSnapshot(overrides));
}
