import { IdGenerator } from '@/server/tasks/application/ports/id-generator';

export class SequentialIdGenerator extends IdGenerator {
  private generatedCount = 0;

  override next(): string {
    this.generatedCount += 1;

    return `task-${String(this.generatedCount)}`;
  }
}
