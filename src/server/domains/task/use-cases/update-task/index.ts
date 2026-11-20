import type { Task } from '@/server/domains/task/entities/entity';
import type { TaskRepository } from '@/server/domains/task/repositories/database-repository';

import type { UpdateTaskInput } from './dto';

export class UpdateTask {
  constructor(private readonly repository: TaskRepository) {}

  async execute(input: UpdateTaskInput): Promise<Task> {
    const task = await this.repository.findExistingById(input.id);

    task.edit({ title: input.title, description: input.description });
    task.changeStatus(input.status);

    await this.repository.save(task);

    return task;
  }
}
