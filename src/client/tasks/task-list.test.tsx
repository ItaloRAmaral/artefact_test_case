import { act, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { InMemoryTaskRepository } from '@/server/domains/task/repositories/in-memory-database-repository';
import { makeTask } from '@/test/factories/make-task';
import { seedTasks } from '@/test/factories/seed-tasks';
import { FakeIntersectionObserver } from '@/test/intersection-observer';
import { renderWithTrpc } from '@/test/render-with-trpc';
import {
  countingLink,
  failingAfterFirstCallLink,
  failingLink,
  failingProcedureLink,
  pendingRefreshLink,
  routerLink,
  scriptedListLink,
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

  it('keeps the feedback regions on the page before any delete', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(makeTask());
    renderWithTrpc(<TaskList />, { repository });

    await screen.findByRole('heading', { name: 'Write the README' });

    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    expect(screen.getByRole('alert')).toBeEmptyDOMElement();
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

  it('links each task to its edit page', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(makeTask());
    renderWithTrpc(<TaskList />, { repository });

    const link = await screen.findByRole('link', {
      name: 'Edit Write the README',
    });

    expect(link).toHaveAttribute('href', '/tasks/task-1/edit');
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

    const message = await screen.findByText(
      'Something went wrong. Check your connection and try again.',
    );

    expect(message).toHaveAttribute('role', 'alert');
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
    expect(
      screen.queryByText(
        'Something went wrong. Check your connection and try again.',
      ),
    ).toBeNull();
  });

  it('shows a success toast after deleting a task', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(makeTask());
    const { user } = renderWithTrpc(<TaskList />, { repository });
    const button = await screen.findByRole('button', {
      name: 'Delete Write the README',
    });

    await user.click(button);

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Task deleted.');
    });
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

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Task deleted.');
    });
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

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'This task no longer exists.',
      );
    });
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
      link: failingProcedureLink(repository, 'task.delete'),
    });
    const button = await screen.findByRole('button', {
      name: 'Delete Write the README',
    });

    await user.click(button);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Something went wrong. Check your connection and try again.',
      );
    });
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
    await screen.findByText('Task deleted.');

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(screen.getByRole('status')).toBeEmptyDOMElement();
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
    await screen.findByText('Task deleted.');
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

  it('loads the next page when the end of the list is reached', async () => {
    const repository = new InMemoryTaskRepository();
    await seedTasks(repository, 11);
    renderWithTrpc(<TaskList />, { repository });
    await screen.findAllByRole('listitem');

    FakeIntersectionObserver.revealAll();

    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(11);
    });
  });

  it('shows a loading indicator while the next page loads', async () => {
    const repository = new InMemoryTaskRepository();
    await seedTasks(repository, 11);
    renderWithTrpc(<TaskList />, { link: pendingRefreshLink(repository) });
    await screen.findAllByRole('listitem');

    FakeIntersectionObserver.revealAll();

    expect(await screen.findByText('Loading more tasks…')).toBeInTheDocument();
  });

  it('does not request the same page twice while it loads', async () => {
    const repository = new InMemoryTaskRepository();
    await seedTasks(repository, 11);
    const counting = countingLink(pendingRefreshLink(repository));
    renderWithTrpc(<TaskList />, { link: counting.link });
    await screen.findAllByRole('listitem');
    FakeIntersectionObserver.revealAll();
    await screen.findByText('Loading more tasks…');

    FakeIntersectionObserver.revealAll();

    expect(counting.listCallCount()).toBe(2);
  });

  it('waits for a running refresh before loading the next page', async () => {
    const repository = new InMemoryTaskRepository();
    await seedTasks(repository, 11);
    const counting = countingLink(pendingRefreshLink(repository));
    const { queryClient } = renderWithTrpc(<TaskList />, {
      link: counting.link,
    });
    await screen.findAllByRole('listitem');
    await act(() => {
      void queryClient.invalidateQueries();

      return Promise.resolve();
    });

    FakeIntersectionObserver.revealAll();

    expect(counting.listCallCount()).toBe(2);
  });

  it('shows an error with a retry when the next page fails', async () => {
    const repository = new InMemoryTaskRepository();
    await seedTasks(repository, 11);
    renderWithTrpc(<TaskList />, {
      link: scriptedListLink(repository, ['serve', 'fail']),
    });
    await screen.findAllByRole('listitem');

    FakeIntersectionObserver.revealAll();

    const message = await screen.findByText(
      'Something went wrong. Check your connection and try again.',
    );
    expect(message).toHaveAttribute('role', 'alert');
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(10);
  });

  it('does not retry a failed page on scroll', async () => {
    const repository = new InMemoryTaskRepository();
    await seedTasks(repository, 11);
    const counting = countingLink(
      scriptedListLink(repository, ['serve', 'fail']),
    );
    renderWithTrpc(<TaskList />, { link: counting.link });
    await screen.findAllByRole('listitem');
    FakeIntersectionObserver.revealAll();
    await screen.findByRole('button', { name: 'Retry' });

    FakeIntersectionObserver.revealAll();

    expect(counting.listCallCount()).toBe(2);
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('loads the failed page again on retry', async () => {
    const repository = new InMemoryTaskRepository();
    await seedTasks(repository, 11);
    const { user } = renderWithTrpc(<TaskList />, {
      link: scriptedListLink(repository, ['serve', 'fail']),
    });
    await screen.findAllByRole('listitem');
    FakeIntersectionObserver.revealAll();
    const retry = await screen.findByRole('button', { name: 'Retry' });

    await user.click(retry);

    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(11);
    });
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
  });

  it('hides the error while the page loads again', async () => {
    const repository = new InMemoryTaskRepository();
    await seedTasks(repository, 11);
    const { user } = renderWithTrpc(<TaskList />, {
      link: scriptedListLink(repository, ['serve', 'fail', 'hang']),
    });
    await screen.findAllByRole('listitem');
    FakeIntersectionObserver.revealAll();
    const retry = await screen.findByRole('button', { name: 'Retry' });

    await user.click(retry);

    expect(await screen.findByText('Loading more tasks…')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
    expect(
      screen.queryByText(
        'Something went wrong. Check your connection and try again.',
      ),
    ).toBeNull();
  });

  it('shows the end of the list after the last page', async () => {
    const repository = new InMemoryTaskRepository();
    await seedTasks(repository, 11);
    renderWithTrpc(<TaskList />, { repository });
    await screen.findAllByRole('listitem');

    FakeIntersectionObserver.revealAll();

    expect(await screen.findByText('No more tasks.')).toBeInTheDocument();
  });

  it('does not request another page after the last one', async () => {
    const repository = new InMemoryTaskRepository();
    await seedTasks(repository, 11);
    const counting = countingLink(routerLink(repository));
    renderWithTrpc(<TaskList />, { link: counting.link });
    await screen.findAllByRole('listitem');
    FakeIntersectionObserver.revealAll();
    await screen.findByText('No more tasks.');

    FakeIntersectionObserver.revealAll();

    expect(counting.listCallCount()).toBe(2);
  });

  it('does not request a page when everything fits in one', async () => {
    const repository = new InMemoryTaskRepository();
    await seedTasks(repository, 10);
    const counting = countingLink(routerLink(repository));
    renderWithTrpc(<TaskList />, { link: counting.link });
    await screen.findAllByRole('listitem');

    FakeIntersectionObserver.revealAll();

    expect(counting.listCallCount()).toBe(1);
    expect(screen.queryByText('No more tasks.')).toBeNull();
  });
});
