import type { TaskRepository } from '@/server/domains/task/repositories/database-repository';
import type { Task } from '@/server/domains/task/entities/entity';

import type { GetTaskInput } from './dto';

export class GetTask {
  constructor(private readonly repository: TaskRepository) {}

  execute(input: GetTaskInput): Promise<Task> {
    return this.repository.findExistingById(input.id);
  }
}
