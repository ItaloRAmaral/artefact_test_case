import type { TaskSnapshot } from '@/server/domains/task/entities/dto';
import type { TaskStatus } from '@/shared/tasks/task-statuses';

export interface TaskPosition {
  readonly createdAt: Date;
  readonly id: string;
}

export interface TaskListFilter {
  readonly titleContains: string | null;
  readonly createdFrom: Date | null;
  readonly createdBefore: Date | null;
  readonly status: TaskStatus | null;
}

export interface InMemoryTaskRepositoryOptions {
  capacity?: number;
  snapshots?: Map<string, TaskSnapshot>;
}
