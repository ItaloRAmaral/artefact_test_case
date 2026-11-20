import { fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { InMemoryTaskRepository } from '@/server/domains/task/repositories/in-memory-database-repository';
import { makeTask } from '@/test/factories/make-task';
import { renderWithTrpc } from '@/test/render-with-trpc';

import { FilteredTaskList } from '.';

describe('FilteredTaskList', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.history.replaceState(null, '', '/');
  });

  it('writes the filter to the URL', () => {
    const replaceState = vi.spyOn(window.history, 'replaceState');
    renderWithTrpc(<FilteredTaskList header={null} initialFilter={{}} />);

    fireEvent.change(screen.getByLabelText('Created from'), {
      target: { value: '2026-11-20' },
    });

    expect(replaceState).toHaveBeenCalledWith(
      null,
      '',
      '?createdFrom=2026-11-20T03%3A00%3A00.000Z',
    );
  });

  it('returns to the plain list URL when no filter is left', () => {
    const replaceState = vi.spyOn(window.history, 'replaceState');
    renderWithTrpc(
      <FilteredTaskList
        header={null}
        initialFilter={{ createdFrom: '2026-11-20T03:00:00.000Z' }}
      />,
    );

    fireEvent.change(screen.getByLabelText('Created from'), {
      target: { value: '' },
    });

    expect(replaceState).toHaveBeenCalledWith(null, '', '/');
  });

  it('does not write the URL away from the list', () => {
    window.history.pushState(null, '', '/tasks/new');
    const replaceState = vi.spyOn(window.history, 'replaceState');
    renderWithTrpc(<FilteredTaskList header={null} initialFilter={{}} />);

    fireEvent.change(screen.getByLabelText('Created from'), {
      target: { value: '2026-11-20' },
    });

    expect(replaceState).not.toHaveBeenCalled();
  });

  it('lists only the tasks that match a new filter', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(
      makeTask({
        title: 'Write the README',
        createdAt: new Date('2026-11-19T12:00:00.000Z'),
      }),
    );
    await repository.save(
      makeTask({
        id: 'task-2',
        title: 'Review the plan',
        createdAt: new Date('2026-11-20T12:00:00.000Z'),
      }),
    );
    renderWithTrpc(<FilteredTaskList header={null} initialFilter={{}} />, {
      repository,
    });
    await screen.findByRole('heading', { name: 'Write the README' });

    fireEvent.change(screen.getByLabelText('Created from'), {
      target: { value: '2026-11-20' },
    });

    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: 'Write the README' }),
      ).toBeNull();
    });
    expect(
      screen.getByRole('heading', { name: 'Review the plan' }),
    ).toBeInTheDocument();
  });

  it('shows the header above the filters', () => {
    renderWithTrpc(
      <FilteredTaskList header={<h1>Tasks</h1>} initialFilter={{}} />,
    );

    const heading = screen.getByRole('heading', { level: 1, name: 'Tasks' });

    expect(
      heading.compareDocumentPosition(screen.getByLabelText('Search by title')),
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });
});
