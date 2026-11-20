import type { TaskSnapshot } from '@/server/domains/task/entities/dto';

export interface TaskPosition {
  readonly createdAt: Date;
  readonly id: string;
}

export interface TaskListFilter {
  readonly titleContains: string | null;
  readonly createdFrom: Date | null;
  readonly createdBefore: Date | null;
}

export interface InMemoryTaskRepositoryOptions {
  capacity?: number;
  snapshots?: Map<string, TaskSnapshot>;
}
