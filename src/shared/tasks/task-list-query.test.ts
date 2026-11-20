import { describe, expect, it } from 'vitest';

import { readTaskListFilter } from './task-list-query';

describe('readTaskListFilter', () => {
  it('reads a valid filter from the URL', () => {
    const params = {
      titleContains: ' readme ',
      createdFrom: '2026-11-20T03:00:00.000Z',
      createdBefore: '2026-11-21T03:00:00.000Z',
      status: 'doing',
    };

    const filter = readTaskListFilter(params);

    expect(filter).toEqual({
      titleContains: 'readme',
      createdFrom: '2026-11-20T03:00:00.000Z',
      createdBefore: '2026-11-21T03:00:00.000Z',
      status: 'doing',
    });
  });

  it('reads no filter from an empty URL', () => {
    const filter = readTaskListFilter({});

    expect(filter).toEqual({});
  });

  it.each([
    { invalid: 'an empty search', params: { titleContains: '' } },
    { invalid: 'a blank search', params: { titleContains: '   ' } },
    { invalid: 'a long search', params: { titleContains: 'a'.repeat(121) } },
    { invalid: 'an invalid date', params: { createdFrom: 'yesterday' } },
    { invalid: 'a repeated key', params: { titleContains: ['a', 'b'] } },
    { invalid: 'an unknown key', params: { page: '2' } },
    { invalid: 'an unknown status', params: { status: 'archived' } },
    { invalid: 'a repeated status', params: { status: ['todo', 'done'] } },
  ])('drops $invalid', ({ params }) => {
    const filter = readTaskListFilter(params);

    expect(filter).toEqual({});
  });

  it('keeps the valid keys when another one is invalid', () => {
    const params = { titleContains: 'readme', createdFrom: 'yesterday' };

    const filter = readTaskListFilter(params);

    expect(filter).toEqual({ titleContains: 'readme' });
  });
});
