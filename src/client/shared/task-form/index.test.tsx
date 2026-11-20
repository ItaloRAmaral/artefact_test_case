import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { InMemoryTaskRepository } from '@/server/domains/task/repositories/in-memory-database-repository';
import { makeCaller } from '@/test/factories/make-caller';
import { makeTask } from '@/test/factories/make-task';
import { renderWithTrpc } from '@/test/render-with-trpc';
import { failingProcedureLink, pendingProcedureLink } from '@/test/trpc-links';

import { TaskForm } from '.';
import { TaskList } from '@/app/_components/task-list';

const { push } = vi.hoisted(() => ({ push: vi.fn<(href: string) => void>() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, bfcacheId: 'test' }),
}));

describe('TaskForm', () => {
  afterEach(() => {
    push.mockReset();
  });

  it('marks the title as required', () => {
    renderWithTrpc(<TaskForm />);

    const titleBox = screen.getByRole('textbox', { name: 'Title' });

    expect(titleBox).toBeRequired();
  });

  it('blocks an empty title with a field message', async () => {
    const repository = new InMemoryTaskRepository();
    const { user } = renderWithTrpc(<TaskForm />, { repository });

    await user.click(screen.getByRole('button', { name: 'Save' }));

    const titleBox = screen.getByRole('textbox', { name: 'Title' });
    expect(titleBox).toHaveAccessibleDescription('Title is required');
    expect(titleBox).toHaveAttribute('aria-invalid', 'true');
    expect((await makeCaller(repository).task.list({})).items).toEqual([]);
    expect(push).not.toHaveBeenCalled();
  });

  it('blocks a whitespace-only title with a field message', async () => {
    const repository = new InMemoryTaskRepository();
    const { user } = renderWithTrpc(<TaskForm />, { repository });
    await user.type(screen.getByLabelText('Title'), '   ');

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(
      screen.getByRole('textbox', { name: 'Title' }),
    ).toHaveAccessibleDescription('Title is required');
    expect((await makeCaller(repository).task.list({})).items).toEqual([]);
    expect(push).not.toHaveBeenCalled();
  });

  it('moves the focus to the title when it is invalid', async () => {
    const { user } = renderWithTrpc(<TaskForm />);

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByRole('textbox', { name: 'Title' })).toHaveFocus();
  });

  it('moves the focus to the description when only it is invalid', async () => {
    const { user } = renderWithTrpc(<TaskForm />);
    await user.type(screen.getByLabelText('Title'), 'Write the README');
    await user.click(screen.getByLabelText('Description'));
    await user.paste('a'.repeat(1001));

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByRole('textbox', { name: 'Description' })).toHaveFocus();
  });

  it('shows the title limit message', async () => {
    const { user } = renderWithTrpc(<TaskForm />);
    await user.click(screen.getByLabelText('Title'));
    await user.paste('a'.repeat(121));

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(
      screen.getByRole('textbox', { name: 'Title' }),
    ).toHaveAccessibleDescription('Title must be at most 120 characters');
  });

  it('shows the description limit message', async () => {
    const { user } = renderWithTrpc(<TaskForm />);
    await user.type(screen.getByLabelText('Title'), 'Write the README');
    await user.click(screen.getByLabelText('Description'));
    await user.paste('a'.repeat(1001));

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(
      screen.getByRole('textbox', { name: 'Description' }),
    ).toHaveAccessibleDescription(
      'Description must be at most 1000 characters',
    );
  });

  it('saves the task with trimmed text', async () => {
    const repository = new InMemoryTaskRepository();
    const { user } = renderWithTrpc(<TaskForm />, { repository });
    await user.type(screen.getByLabelText('Title'), '  Write the README  ');
    await user.type(
      screen.getByLabelText('Description'),
      'Explain how to run it',
    );

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Task created.');
    });
    expect((await makeCaller(repository).task.list({})).items).toMatchObject([
      { title: 'Write the README', description: 'Explain how to run it' },
    ]);
  });

  it('goes back to the list with a success message after creating', async () => {
    const { user } = renderWithTrpc(<TaskForm />);
    await user.type(screen.getByLabelText('Title'), 'Write the README');

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith('/');
    });
    expect(screen.getByRole('status')).toHaveTextContent('Task created.');
  });

  it('disables the save button while saving', async () => {
    const repository = new InMemoryTaskRepository();
    const { user } = renderWithTrpc(<TaskForm />, {
      link: pendingProcedureLink(repository, 'task.create'),
    });
    await user.type(screen.getByLabelText('Title'), 'Write the README');

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(
      await screen.findByRole('button', { name: 'Saving…' }),
    ).toBeDisabled();
  });

  it('keeps the save button disabled after the task is created', async () => {
    const { user } = renderWithTrpc(<TaskForm />);
    await user.type(screen.getByLabelText('Title'), 'Write the README');

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Task created.');
    });
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('shows the storage-full message when the list is full', async () => {
    const repository = new InMemoryTaskRepository({ capacity: 1 });
    await repository.save(makeTask());
    const { user } = renderWithTrpc(<TaskForm />, { repository });
    await user.type(screen.getByLabelText('Title'), 'Review the plan');

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'The task list is full. Delete a task to add a new one.',
      );
    });
    expect(push).not.toHaveBeenCalled();
  });

  it('keeps the typed values when saving fails', async () => {
    const repository = new InMemoryTaskRepository();
    const { user } = renderWithTrpc(<TaskForm />, {
      link: failingProcedureLink(repository, 'task.create'),
    });
    await user.type(screen.getByLabelText('Title'), 'Write the README');

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Something went wrong. Check your connection and try again.',
      );
    });
    expect(screen.getByRole('textbox', { name: 'Title' })).toHaveValue(
      'Write the README',
    );
    expect(push).not.toHaveBeenCalled();
  });

  it('shows the created task in the list', async () => {
    const { user } = renderWithTrpc(
      <>
        <TaskList filter={{}} />
        <TaskForm />
      </>,
    );
    await screen.findByText('No tasks yet.');
    await user.type(screen.getByLabelText('Title'), 'Review the plan');

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(
      await screen.findByRole('heading', { name: 'Review the plan' }),
    ).toBeInTheDocument();
  });

  it('shows the created task as soon as the list is back', async () => {
    const { user, rerender } = renderWithTrpc(<TaskList filter={{}} />);
    await screen.findByText('No tasks yet.');
    rerender(<TaskForm />);
    await user.type(screen.getByLabelText('Title'), 'Review the plan');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Task created.');
    });

    rerender(<TaskList filter={{}} />);

    expect(
      screen.getByRole('heading', { name: 'Review the plan' }),
    ).toBeInTheDocument();
  });
});
