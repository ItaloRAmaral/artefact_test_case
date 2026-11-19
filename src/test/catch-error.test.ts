import { describe, expect, it } from 'vitest';

import { catchError } from './catch-error';

describe('catchError', () => {
  it('returns the error the function throws', () => {
    const thrown = new Error('boom');

    const error = catchError(() => {
      throw thrown;
    });

    expect(error).toBe(thrown);
  });

  it('throws when the function does not throw', () => {
    const error = catchError(() => catchError(() => 'no error'));

    expect(error).toBeInstanceOf(Error);
  });
});
