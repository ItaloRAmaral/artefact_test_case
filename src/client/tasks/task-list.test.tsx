import { act, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { InMemoryTaskRepository } from '@/server/domains/task/repositories/in-memory-database-repository';
import { makeTask } from '@/test/factories/make-task';
import { renderWithTrpc } from '@/test/render-with-trpc';
import {
  failingAfterFirstCallLink,
  failingDeleteLink,
  failingLink,
  pendingRefreshLink,
} from '@/test/trpc-links';

import { TaskList } from './task-list';

const SECOND_TASK = {
  id: 'task-2',
  title: 'Review the plan',
  createdAt: new Date('2026-11-19T12:01:00.000Z'),
};

describe('TaskList', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

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

  it('shows a success toast after deleting a task', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(makeTask());
    const { user } = renderWithTrpc(<TaskList />, { repository });
    const button = await screen.findByRole('button', {
      name: 'Delete Write the README',
    });

    await user.click(button);

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Task deleted.',
    );
  });

  it('removes the deleted task from the list', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(makeTask());
    await repository.save(makeTask(SECOND_TASK));
    const { user } = renderWithTrpc(<TaskList />, { repository });
    const button = await screen.findByRole('button', {
      name: 'Delete Write the README',
    });

    await user.click(button);

    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: 'Write the README' }),
      ).toBeNull();
    });
    expect(
      screen.getByRole('heading', { name: 'Review the plan' }),
    ).toBeInTheDocument();
  });

  it('keeps the delete buttons disabled until the list has refetched', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(makeTask());
    await repository.save(makeTask(SECOND_TASK));
    const { user } = renderWithTrpc(<TaskList />, {
      link: pendingRefreshLink(repository),
    });
    const button = await screen.findByRole('button', {
      name: 'Delete Write the README',
    });

    await user.click(button);

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Task deleted.',
    );
    expect(button).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Delete Review the plan' }),
    ).toBeDisabled();
  });

  it('keeps the success toast when the last task is deleted', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(makeTask());
    const { user } = renderWithTrpc(<TaskList />, { repository });
    const button = await screen.findByRole('button', {
      name: 'Delete Write the README',
    });

    await user.click(button);

    expect(await screen.findByText('No tasks yet.')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Task deleted.');
  });

  it('shows the not-found message when the task is already gone', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(makeTask());
    const { user } = renderWithTrpc(<TaskList />, { repository });
    const button = await screen.findByRole('button', {
      name: 'Delete Write the README',
    });
    await repository.delete('task-1');

    await user.click(button);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This task no longer exists.',
    );
    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: 'Write the README' }),
      ).toBeNull();
    });
  });

  it('shows the generic message when the delete fails', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(makeTask());
    const { user } = renderWithTrpc(<TaskList />, {
      link: failingDeleteLink(repository),
    });
    const button = await screen.findByRole('button', {
      name: 'Delete Write the README',
    });

    await user.click(button);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Something went wrong. Check your connection and try again.',
    );
    expect(
      screen.getByRole('heading', { name: 'Write the README' }),
    ).toBeInTheDocument();
  });

  it('hides the toast after 4 seconds', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const repository = new InMemoryTaskRepository();
    await repository.save(makeTask());
    const { user } = renderWithTrpc(<TaskList />, { repository });
    await user.click(
      await screen.findByRole('button', { name: 'Delete Write the README' }),
    );
    await screen.findByRole('status');

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(screen.queryByRole('status')).toBeNull();
  });

  it('restarts the toast timer on a new delete', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const repository = new InMemoryTaskRepository();
    await repository.save(makeTask());
    await repository.save(makeTask(SECOND_TASK));
    const { user } = renderWithTrpc(<TaskList />, { repository });
    await user.click(
      await screen.findByRole('button', { name: 'Delete Write the README' }),
    );
    await screen.findByRole('status');
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    await user.click(
      await screen.findByRole('button', { name: 'Delete Review the plan' }),
    );
    await screen.findByText('No tasks yet.');

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByRole('status')).toHaveTextContent('Task deleted.');
  });
});
