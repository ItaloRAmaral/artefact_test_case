import { describe, expect, it } from 'vitest';

import { TASK_STATUS_LABELS, toTaskStatus } from '.';

describe('task status', () => {
  it('labels each status', () => {
    const labels = TASK_STATUS_LABELS;

    expect(labels).toEqual({ todo: 'To do', doing: 'Doing', done: 'Done' });
  });

  it('reads a status from a select value', () => {
    const status = toTaskStatus('doing');

    expect(status).toBe('doing');
  });

  it.each(['', 'archived', 'Doing'])(
    'reads no status from the value "%s"',
    (value) => {
      const status = toTaskStatus(value);

      expect(status).toBeUndefined();
    },
  );
});
