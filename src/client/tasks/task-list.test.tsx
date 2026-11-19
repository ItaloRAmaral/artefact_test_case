import { act, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { InMemoryTaskRepository } from '@/server/domains/task/repositories/in-memory-database-repository';
import { makeTask } from '@/test/factories/make-task';
import { renderWithTrpc } from '@/test/render-with-trpc';
import { failingAfterFirstCallLink, failingLink } from '@/test/trpc-links';

import { TaskList } from './task-list';

describe('TaskList', () => {
  it('shows the loading state while the list loads', () => {
    renderWithTrpc(<TaskList />);

    const loading = screen.getByText('Loading tasks…');

    expect(loading).toBeInTheDocument();
  });

  it('shows each task with its title, description and date', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(makeTask({ description: 'Explain how to run it' }));
    renderWithTrpc(<TaskList />, { repository });

    const heading = await screen.findByRole('heading', {
      name: 'Write the README',
    });

    expect(heading).toBeInTheDocument();
    expect(screen.getByText('Explain how to run it')).toBeInTheDocument();
    expect(screen.getByRole('time')).toHaveAttribute(
      'dateTime',
      '2026-11-19T12:00:00.000Z',
    );
  });

  it('shows no description for a task without one', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(makeTask());
    renderWithTrpc(<TaskList />, { repository });

    const item = await screen.findByRole('listitem');

    expect(item.querySelector('p')).toBeNull();
  });

  it('shows the empty state when there are no tasks', async () => {
    renderWithTrpc(<TaskList />);

    const emptyState = await screen.findByText('No tasks yet.');

    expect(emptyState).toBeInTheDocument();
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('shows task text as plain text', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(makeTask({ title: '<script>alert(1)</script>' }));
    const { container } = renderWithTrpc(<TaskList />, { repository });

    const heading = await screen.findByRole('heading', {
      name: '<script>alert(1)</script>',
    });

    expect(heading).toBeInTheDocument();
    expect(container.querySelector('script')).toBeNull();
  });

  it('shows an error when the list fails to load', async () => {
    renderWithTrpc(<TaskList />, { link: failingLink });

    const alert = await screen.findByRole('alert');

    expect(alert).toHaveTextContent(
      'Something went wrong. Check your connection and try again.',
    );
  });

  it('keeps the tasks when a refresh fails', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(makeTask());
    const { queryClient } = renderWithTrpc(<TaskList />, {
      link: failingAfterFirstCallLink(repository),
    });
    await screen.findByRole('heading', { name: 'Write the README' });

    await act(() => queryClient.invalidateQueries());

    expect(
      screen.getByRole('heading', { name: 'Write the README' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
