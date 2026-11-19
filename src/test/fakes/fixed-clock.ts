import { Clock } from '@/server/domains/task/providers/clock';

export class FixedClock extends Clock {
  constructor(private readonly fixedNow: Date) {
    super();
  }

  override now(): Date {
    return new Date(this.fixedNow);
  }
}
