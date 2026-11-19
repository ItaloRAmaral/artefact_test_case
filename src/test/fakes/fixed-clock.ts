import { Clock } from '@/server/tasks/application/ports/clock';

export class FixedClock extends Clock {
  constructor(private readonly fixedNow: Date) {
    super();
  }

  override now(): Date {
    return new Date(this.fixedNow);
  }
}
