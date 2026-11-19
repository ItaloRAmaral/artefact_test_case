import type { Clock } from '@/server/domains/task/providers/clock';
import type { IdGenerator } from '@/server/domains/task/providers/id-generator';
import type { TaskRepository } from '@/server/domains/task/repositories/database-repository';
import { Task } from '@/server/domains/task/entities/entity';

import type { CreateTaskInput } from './dto';

export class CreateTask {
  constructor(
    private readonly repository: TaskRepository,
    private readonly clock: Clock,
    private readonly idGenerator: IdGenerator,
  ) {}

  async execute(input: CreateTaskInput): Promise<Task> {
    const task = Task.create({
      id: this.idGenerator.next(),
      title: input.title,
      description: input.description,
      createdAt: this.clock.now(),
    });

    await this.repository.save(task);

    return task;
  }
}
