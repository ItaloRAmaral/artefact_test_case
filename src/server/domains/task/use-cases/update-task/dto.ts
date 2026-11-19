import type { TaskContent } from '@/server/domains/task/entities/dto';

export interface UpdateTaskInput extends TaskContent {
  readonly id: string;
}
