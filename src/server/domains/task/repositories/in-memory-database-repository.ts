import type { TaskSnapshot } from '@/server/domains/task/entities/dto';
import { Task } from '@/server/domains/task/entities/entity';
import {
  TaskNotFoundError,
  TaskStorageFullError,
} from '@/server/domains/task/entities/errors';

import { TaskRepository } from './database-repository';
import type {
  InMemoryTaskRepositoryOptions,
  TaskListFilter,
  TaskPosition,
} from './dto';

export class InMemoryTaskRepository extends TaskRepository {
  private static readonly DEFAULT_CAPACITY = 1000;

  private readonly capacity: number;

  private readonly snapshots: Map<string, TaskSnapshot>;

  constructor({
    capacity = InMemoryTaskRepository.DEFAULT_CAPACITY,
    snapshots = new Map<string, TaskSnapshot>(),
  }: InMemoryTaskRepositoryOptions = {}) {
    super();
    this.capacity = capacity;
    this.snapshots = snapshots;
  }

  override findExistingById(id: string): Promise<Task> {
    const snapshot = this.snapshots.get(id);

    if (snapshot === undefined) {
      return Promise.reject(new TaskNotFoundError());
    }

    return Promise.resolve(Task.restore(snapshot));
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
    filter: TaskListFilter,
  ): Promise<Task[]> {
    // Filters by position, not by id, so a cursor still works after its task is deleted
    // (DECISIONS D-21). The filter is applied before the slice, like a WHERE clause, so a
    // page holds only matching tasks and paging continues with the same filter (D-34).
    const tasks = [...this.snapshots.values()]
      .sort((a, b) => InMemoryTaskRepository.compareNewestFirst(a, b))
      .filter(
        (snapshot) =>
          (position === null ||
            InMemoryTaskRepository.compareNewestFirst(position, snapshot) <
              0) &&
          InMemoryTaskRepository.matches(snapshot, filter),
      )
      .slice(0, count)
      .map((snapshot) => Task.restore(snapshot));

    return Promise.resolve(tasks);
  }

  private static matches(snapshot: TaskSnapshot, filter: TaskListFilter) {
    return (
      (filter.titleContains === null ||
        InMemoryTaskRepository.toSearchable(snapshot.title).includes(
          InMemoryTaskRepository.toSearchable(filter.titleContains),
        )) &&
      (filter.createdFrom === null ||
        snapshot.createdAt.getTime() >= filter.createdFrom.getTime()) &&
      (filter.createdBefore === null ||
        snapshot.createdAt.getTime() < filter.createdBefore.getTime())
    );
  }

  // Ignores case and accents, so "acao" finds "Ação" (user decision, D-34): NFD splits each
  // accented letter into the letter and its mark, and the marks are dropped.
  private static toSearchable(text: string): string {
    return text
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase();
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
