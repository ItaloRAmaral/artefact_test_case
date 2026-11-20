import type { TaskRepository } from '@/server/domains/task/repositories/database-repository';

import { makeTask } from './make-task';

/**
 * Stores tasks `task-1` to `task-<count>`, one minute apart.
 *
 * @param repository - Where to store them.
 * @param count - How many tasks.
 */
export async function seedTasks(
  repository: TaskRepository,
  count: number,
): Promise<void> {
  for (let n = 1; n <= count; n += 1) {
    const minute = String(n).padStart(2, '0');

    await repository.save(
      makeTask({
        id: `task-${String(n)}`,
        createdAt: new Date(`2026-11-19T12:${minute}:00.000Z`),
      }),
    );
  }
}
