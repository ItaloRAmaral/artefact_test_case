import type { TaskRepository } from '@/server/domains/task/repositories/database-repository';

import type { DeleteTaskInput } from './dto';

export class DeleteTask {
  constructor(private readonly repository: TaskRepository) {}

  async execute(input: DeleteTaskInput): Promise<void> {
    const task = await this.repository.findExistingById(input.id);

    await this.repository.delete(task.id);
  }
}
