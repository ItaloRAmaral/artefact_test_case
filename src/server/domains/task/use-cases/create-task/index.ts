import { Task } from '@/server/domains/task/entities/entity';
import type { TaskRepository } from '@/server/domains/task/repositories/database-repository';

import type { CreateTaskInput } from './dto';

export class CreateTask {
  constructor(private readonly repository: TaskRepository) {}

  async execute(input: CreateTaskInput): Promise<Task> {
    const task = Task.create({
      id: crypto.randomUUID(),
      title: input.title,
      description: input.description,
      status: input.status,
      createdAt: new Date(),
    });

    await this.repository.save(task);

    return task;
  }
}
