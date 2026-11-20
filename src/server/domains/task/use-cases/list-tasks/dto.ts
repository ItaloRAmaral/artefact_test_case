import type { Task } from '@/server/domains/task/entities/entity';
import type { TaskListFilter } from '@/server/domains/task/repositories/dto';

export interface ListTasksInput extends TaskListFilter {
  readonly cursor: string | null;
  readonly limit: number;
}

export interface ListTasksOutput {
  readonly items: readonly Task[];
  readonly nextCursor: string | null;
}
