import 'server-only';

import type { Task } from '@/server/domains/task/entities/entity';

import type { TaskDto } from './dto';

export function toTaskDto(task: Task): TaskDto {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    createdAt: task.createdAt.toISOString(),
  };
}
