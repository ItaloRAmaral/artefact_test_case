import { describe, expect, it } from 'vitest';

import { getErrorMessage, isTemporaryError } from './error-message';

describe('getErrorMessage', () => {
  it.each([
    {
      code: 'NOT_FOUND',
      domainCode: 'TASK_NOT_FOUND',
      message: 'This task no longer exists.',
    },
    {
      code: 'BAD_REQUEST',
      domainCode: 'TASK_TITLE_REQUIRED',
      message: 'Title is required.',
    },
    {
      code: 'BAD_REQUEST',
      domainCode: 'TASK_TITLE_TOO_LONG',
      message: 'Title must be at most 120 characters.',
    },
    {
      code: 'BAD_REQUEST',
      domainCode: 'TASK_DESCRIPTION_TOO_LONG',
      message: 'Description must be at most 1000 characters.',
    },
    {
      code: 'BAD_REQUEST',
      domainCode: 'TASK_CURSOR_INVALID',
      message: 'The list could not be loaded. Reload the page.',
    },
    {
      code: 'CONFLICT',
      domainCode: 'TASK_STORAGE_FULL',
      message: 'The task list is full. Delete a task to add a new one.',
    },
  ])('maps $domainCode to its message', ({ code, domainCode, message }) => {
    const error = { data: { code, domainCode } };

    const text = getErrorMessage(error);

    expect(text).toBe(message);
  });

  it('maps a BAD_REQUEST without a domain code to the invalid-fields message', () => {
    const error = { data: { code: 'BAD_REQUEST', domainCode: null } };

    const text = getErrorMessage(error);

    expect(text).toBe('Some fields are invalid.');
  });

  it.each([
    {
      case: 'an unknown domain code',
      error: { data: { code: 'NOT_FOUND', domainCode: 'SOMETHING_NEW' } },
    },
    { case: 'no data', error: { data: undefined } },
    { case: 'no error', error: null },
  ])('falls back to the generic message for $case', ({ error }) => {
    const text = getErrorMessage(error);

    expect(text).toBe(
      'Something went wrong. Check your connection and try again.',
    );
  });
});

describe('isTemporaryError', () => {
  it.each([
    { case: 'a failure without data', error: { data: null } },
    {
      case: 'a server error',
      error: { data: { code: 'INTERNAL_SERVER_ERROR' } },
    },
  ])('treats $case as temporary', ({ error }) => {
    const temporary = isTemporaryError(error);

    expect(temporary).toBe(true);
  });

  it.each([
    { case: 'a missing task', error: { data: { code: 'NOT_FOUND' } } },
    { case: 'an invalid input', error: { data: { code: 'BAD_REQUEST' } } },
  ])('treats $case as permanent', ({ error }) => {
    const temporary = isTemporaryError(error);

    expect(temporary).toBe(false);
  });
});
