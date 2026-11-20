import type { TaskRepository } from '@/server/domains/task/repositories/database-repository';

import type { ListTasksInput, ListTasksOutput } from './dto';
import { decodeTaskCursor, encodeTaskCursor } from './task-cursor';

export class ListTasks {
  constructor(private readonly repository: TaskRepository) {}

  async execute(input: ListTasksInput): Promise<ListTasksOutput> {
    const position =
      input.cursor === null ? null : decodeTaskCursor(input.cursor);
    const tasks = await this.repository.listAfter(position, input.limit + 1, {
      titleContains: input.titleContains,
      createdFrom: input.createdFrom,
      createdBefore: input.createdBefore,
      status: input.status,
    });
    const hasNextPage = tasks.length > input.limit;
    const lastTaskOfPage = hasNextPage ? tasks[input.limit - 1] : undefined;

    return {
      items: tasks.slice(0, input.limit),
      nextCursor:
        lastTaskOfPage === undefined ? null : encodeTaskCursor(lastTaskOfPage),
    };
  }
}
