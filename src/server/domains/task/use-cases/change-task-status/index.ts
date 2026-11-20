import type { Task } from '@/server/domains/task/entities/entity';
import type { TaskRepository } from '@/server/domains/task/repositories/database-repository';

import type { ChangeTaskStatusInput } from './dto';

export class ChangeTaskStatus {
  constructor(private readonly repository: TaskRepository) {}

  async execute(input: ChangeTaskStatusInput): Promise<Task> {
    const task = await this.repository.findExistingById(input.id);

    task.changeStatus(input.status);

    await this.repository.save(task);

    return task;
  }
}
