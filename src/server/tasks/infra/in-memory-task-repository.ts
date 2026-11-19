import 'server-only';

import type { TaskPosition } from '../application/ports/interfaces/task-position';
import { TaskRepository } from '../application/ports/task-repository';
import type { TaskSnapshot } from '../domain/interfaces/task-snapshot';
import { Task } from '../domain/task';
import { TaskStorageFullError } from '../domain/task-errors';

export class InMemoryTaskRepository extends TaskRepository {
  private static readonly DEFAULT_CAPACITY = 1000;

  private readonly snapshots = new Map<string, TaskSnapshot>();

  constructor(
    private readonly capacity = InMemoryTaskRepository.DEFAULT_CAPACITY,
  ) {
    super();
  }

  override findById(id: string): Promise<Task | null> {
    const snapshot = this.snapshots.get(id);

    return Promise.resolve(snapshot ? Task.restore(snapshot) : null);
  }

  override save(task: Task): Promise<void> {
    const isNewTask = !this.snapshots.has(task.id);

    if (isNewTask && this.snapshots.size >= this.capacity) {
      return Promise.reject(new TaskStorageFullError());
    }

    this.snapshots.set(task.id, task.toSnapshot());

    return Promise.resolve();
  }

  override delete(id: string): Promise<void> {
    this.snapshots.delete(id);

    return Promise.resolve();
  }

  override listAfter(
    position: TaskPosition | null,
    count: number,
  ): Promise<Task[]> {
    // Filters by position, not by id, so a cursor still works after its task is deleted (D-21).
    const tasks = [...this.snapshots.values()]
      .sort((a, b) => InMemoryTaskRepository.compareNewestFirst(a, b))
      .filter(
        (snapshot) =>
          position === null ||
          InMemoryTaskRepository.compareNewestFirst(position, snapshot) < 0,
      )
      .slice(0, count)
      .map((snapshot) => Task.restore(snapshot));

    return Promise.resolve(tasks);
  }

  private static compareNewestFirst(a: TaskPosition, b: TaskPosition): number {
    const byCreatedAt = b.createdAt.getTime() - a.createdAt.getTime();

    if (byCreatedAt !== 0) {
      return byCreatedAt;
    }

    if (a.id === b.id) {
      return 0;
    }

    return a.id > b.id ? -1 : 1;
  }
}
