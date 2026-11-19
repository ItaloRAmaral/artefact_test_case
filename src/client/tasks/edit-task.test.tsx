import { act, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { InMemoryTaskRepository } from '@/server/domains/task/repositories/in-memory-database-repository';
import { makeTask } from '@/test/factories/make-task';
import { renderWithTrpc } from '@/test/render-with-trpc';
import {
  failingAfterFirstCallLink,
  pendingProcedureLink,
} from '@/test/trpc-links';

import { EditTask } from './edit-task';
import { TaskList } from './task-list';

const { push } = vi.hoisted(() => ({ push: vi.fn<(href: string) => void>() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, bfcacheId: 'test' }),
}));

describe('EditTask', () => {
  afterEach(() => {
    push.mockReset();
  });

  it('shows the loading state while the task loads', () => {
    renderWithTrpc(<EditTask id="task-1" />);

    const loading = screen.getByText('Loading task…');

    expect(loading).toBeInTheDocument();
  });

  it('prefills the form with the task', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(makeTask({ description: 'Explain how to run it' }));
    renderWithTrpc(<EditTask id="task-1" />, { repository });

    const titleBox = await screen.findByRole('textbox', { name: 'Title' });

    expect(titleBox).toHaveValue('Write the README');
    expect(screen.getByRole('textbox', { name: 'Description' })).toHaveValue(
      'Explain how to run it',
    );
  });

  it('prefills an empty description for a task without one', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(makeTask());
    renderWithTrpc(<EditTask id="task-1" />, { repository });

    const descriptionBox = await screen.findByRole('textbox', {
      name: 'Description',
    });

    expect(descriptionBox).toHaveValue('');
  });

  it('shows the not-found message for a missing task', async () => {
    renderWithTrpc(<EditTask id="missing" />);

    const message = await screen.findByText('This task no longer exists.');

    expect(message).toHaveAttribute('role', 'alert');
    expect(screen.queryByRole('textbox', { name: 'Title' })).toBeNull();
  });

  it('shows the invalid-fields message for an id that is too long', async () => {
    renderWithTrpc(<EditTask id={'a'.repeat(37)} />);

    const message = await screen.findByText('Some fields are invalid.');

    expect(message).toHaveAttribute('role', 'alert');
  });

  it('saves the edited task', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(makeTask());
    const { user } = renderWithTrpc(<EditTask id="task-1" />, { repository });
    const titleBox = await screen.findByRole('textbox', { name: 'Title' });
    await user.clear(titleBox);
    await user.type(titleBox, 'Review the plan');
    await user.type(
      screen.getByRole('textbox', { name: 'Description' }),
      'Check the edge cases',
    );

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Task saved.');
    });
    expect(
      (await repository.findExistingById('task-1')).toSnapshot(),
    ).toMatchObject({
      title: 'Review the plan',
      description: 'Check the edge cases',
    });
  });

  it('goes back to the list with a success message after saving', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(makeTask());
    const { user } = renderWithTrpc(<EditTask id="task-1" />, { repository });
    await screen.findByRole('textbox', { name: 'Title' });

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith('/');
    });
    expect(screen.getByRole('status')).toHaveTextContent('Task saved.');
  });

  it('disables the save button while saving the edit', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(makeTask());
    const { user } = renderWithTrpc(<EditTask id="task-1" />, {
      link: pendingProcedureLink(repository, 'task.update'),
    });
    await screen.findByRole('textbox', { name: 'Title' });

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(
      await screen.findByRole('button', { name: 'Saving…' }),
    ).toBeDisabled();
  });

  it('keeps the save button disabled after the task is saved', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(makeTask());
    const { user } = renderWithTrpc(<EditTask id="task-1" />, { repository });
    await screen.findByRole('textbox', { name: 'Title' });

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Task saved.');
    });
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('clears the description when it is emptied', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(makeTask({ description: 'Explain how to run it' }));
    const { user } = renderWithTrpc(<EditTask id="task-1" />, { repository });
    await user.clear(
      await screen.findByRole('textbox', { name: 'Description' }),
    );

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Task saved.');
    });
    expect(
      (await repository.findExistingById('task-1')).toSnapshot().description,
    ).toBeNull();
  });

  it('blocks a blank title when editing', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(makeTask());
    const { user } = renderWithTrpc(<EditTask id="task-1" />, { repository });
    await user.clear(await screen.findByRole('textbox', { name: 'Title' }));

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(
      screen.getByRole('textbox', { name: 'Title' }),
    ).toHaveAccessibleDescription('Title is required');
    expect(
      (await repository.findExistingById('task-1')).toSnapshot().title,
    ).toBe('Write the README');
  });

  it('shows the not-found message when the task was deleted while editing', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(makeTask());
    const { user } = renderWithTrpc(<EditTask id="task-1" />, { repository });
    await screen.findByRole('textbox', { name: 'Title' });
    await repository.delete('task-1');

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'This task no longer exists.',
      );
    });
    expect(push).not.toHaveBeenCalled();
  });

  it('keeps the form when a refresh fails', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(makeTask());
    const { queryClient } = renderWithTrpc(<EditTask id="task-1" />, {
      link: failingAfterFirstCallLink(repository),
    });
    await screen.findByRole('textbox', { name: 'Title' });

    await act(() => queryClient.invalidateQueries());

    expect(screen.getByRole('textbox', { name: 'Title' })).toBeInTheDocument();
  });

  it('shows the updated title in the list', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(makeTask());
    const { user } = renderWithTrpc(
      <>
        <TaskList />
        <EditTask id="task-1" />
      </>,
      { repository },
    );
    const titleBox = await screen.findByRole('textbox', { name: 'Title' });
    await user.clear(titleBox);
    await user.type(titleBox, 'Review the plan');

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(
      await screen.findByRole('heading', { name: 'Review the plan' }),
    ).toBeInTheDocument();
  });

  it('prefills the saved values when the task is opened again', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.save(makeTask());
    const { user, rerender } = renderWithTrpc(<EditTask id="task-1" />, {
      repository,
    });
    const titleBox = await screen.findByRole('textbox', { name: 'Title' });
    await user.clear(titleBox);
    await user.type(titleBox, 'Review the plan');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Task saved.');
    });

    rerender(<EditTask key="reopened" id="task-1" />);

    expect(screen.getByRole('textbox', { name: 'Title' })).toHaveValue(
      'Review the plan',
    );
  });
});
