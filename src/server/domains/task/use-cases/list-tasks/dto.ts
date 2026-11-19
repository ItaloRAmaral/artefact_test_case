import type { Task } from '@/server/domains/task/entities/entity';

export interface ListTasksInput {
  readonly cursor: string | null;
  readonly limit: number;
}

export interface ListTasksOutput {
  readonly items: Task[];
  readonly nextCursor: string | null;
}
