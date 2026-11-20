import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { InMemoryTaskRepository } from '@/server/domains/task/repositories/in-memory-database-repository';
import { makeCaller } from '@/test/factories/make-caller';
import { makeTask } from '@/test/factories/make-task';
import { renderWithTrpc } from '@/test/render-with-trpc';
import {
  failingProcedureLink,
  pendingProcedureLink,
  scriptedProcedureLink,
} from '@/test/trpc-links';

import { TaskForm } from '.';
import { TaskList } from '@/app/_components/task-list';
import { Modal } from '@/client/shared/modal';

const { push, back } = vi.hoisted(() => ({
  push: vi.fn<(href: string) => void>(),
  back: vi.fn<() => void>(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, back, bfcacheId: 'test' }),
}));

describe('TaskForm', () => {
  afterEach(() => {
    push.mockReset();
    back.mockReset();
  });

  it('starts with the focus on the title', () => {
    renderWithTrpc(<TaskForm />);

    const titleBox = screen.getByRole('textbox', { name: 'Title' });

    expect(titleBox).toHaveFocus();
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
    expect(titleBox).toHaveAccessibleDescription(
      expect.stringContaining('Title is required'),
    );
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
    ).toHaveAccessibleDescription(expect.stringContaining('Title is required'));
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
    ).toHaveAccessibleDescription(
      expect.stringContaining('Title must be at most 120 characters'),
    );
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
      expect.stringContaining('Description must be at most 1000 characters'),
    );
  });

  it('shows the title limit message while typing, before saving', async () => {
    const { user } = renderWithTrpc(<TaskForm />);
    await user.click(screen.getByLabelText('Title'));

    await user.paste('a'.repeat(121));

    const titleBox = screen.getByRole('textbox', { name: 'Title' });
    expect(titleBox).toHaveAccessibleDescription(
      expect.stringContaining('Title must be at most 120 characters'),
    );
    expect(titleBox).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows the description limit message while typing, before saving', async () => {
    const { user } = renderWithTrpc(<TaskForm />);
    await user.click(screen.getByLabelText('Description'));

    await user.paste('a'.repeat(1001));

    expect(
      screen.getByRole('textbox', { name: 'Description' }),
    ).toHaveAccessibleDescription(
      expect.stringContaining('Description must be at most 1000 characters'),
    );
  });

  it('clears the limit message once the title is short enough', async () => {
    const { user } = renderWithTrpc(<TaskForm />);
    await user.click(screen.getByLabelText('Title'));
    await user.paste('a'.repeat(121));

    await user.keyboard('{Backspace}');

    expect(screen.getByRole('textbox', { name: 'Title' })).toHaveAttribute(
      'aria-invalid',
      'false',
    );
    expect(
      screen.queryByText('Title must be at most 120 characters'),
    ).toBeNull();
  });

  it('clears the required message once a title is typed', async () => {
    const { user } = renderWithTrpc(<TaskForm />);
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await user.type(screen.getByLabelText('Title'), 'W');

    expect(screen.queryByText('Title is required')).toBeNull();
  });

  it('does not show the required message while the title is retyped', async () => {
    const { user } = renderWithTrpc(<TaskForm />);
    await user.type(screen.getByLabelText('Title'), 'Write');

    await user.clear(screen.getByLabelText('Title'));

    expect(screen.queryByText('Title is required')).toBeNull();
  });

  it('counts the title characters after trimming', async () => {
    const { user } = renderWithTrpc(<TaskForm />);

    await user.type(screen.getByLabelText('Title'), '  Write  ');

    expect(
      screen.getByRole('textbox', { name: 'Title' }),
    ).toHaveAccessibleDescription('5/120 characters');
  });

  it('counts the description characters', async () => {
    const { user } = renderWithTrpc(<TaskForm />);

    await user.type(screen.getByLabelText('Description'), 'How to run');

    expect(
      screen.getByRole('textbox', { name: 'Description' }),
    ).toHaveAccessibleDescription('10/1000 characters');
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

    const message = await screen.findByText(
      'The task list is full. Delete a task to add a new one.',
    );
    expect(message).toHaveAttribute('role', 'alert');
    expect(push).not.toHaveBeenCalled();
  });

  it('keeps the typed values when saving fails', async () => {
    const repository = new InMemoryTaskRepository();
    const { user } = renderWithTrpc(<TaskForm />, {
      link: failingProcedureLink(repository, 'task.create'),
    });
    await user.type(screen.getByLabelText('Title'), 'Write the README');

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await screen.findByText(
      'Something went wrong. Check your connection and try again.',
    );
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

  it('shows a failed save in the form, not in a toast', async () => {
    const repository = new InMemoryTaskRepository();
    const { user } = renderWithTrpc(<TaskForm />, {
      link: failingProcedureLink(repository, 'task.create'),
    });
    await user.type(screen.getByLabelText('Title'), 'Write the README');

    await user.click(screen.getByRole('button', { name: 'Save' }));

    const message = await screen.findByText(
      'Something went wrong. Check your connection and try again.',
    );
    expect(
      screen.getByRole('button', { name: 'Save' }).closest('form'),
    ).toContainElement(message);
  });

  it('clears the failed-save message on the next save', async () => {
    const repository = new InMemoryTaskRepository();
    const { user } = renderWithTrpc(<TaskForm />, {
      link: scriptedProcedureLink(repository, 'task.create', ['fail', 'hang']),
    });
    await user.type(screen.getByLabelText('Title'), 'Write the README');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await screen.findByText(
      'Something went wrong. Check your connection and try again.',
    );

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await screen.findByRole('button', { name: 'Saving…' });
    expect(
      screen.queryByText(
        'Something went wrong. Check your connection and try again.',
      ),
    ).toBeNull();
  });

  it('closes the modal instead of going to the list after saving', async () => {
    const { user } = renderWithTrpc(
      <Modal title="New task">
        <TaskForm />
      </Modal>,
    );
    await user.type(screen.getByLabelText('Title'), 'Write the README');

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(back).toHaveBeenCalledOnce();
    });
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('shows the success message once the modal has closed', async () => {
    const { user, rerender } = renderWithTrpc(
      <Modal title="New task">
        <TaskForm />
      </Modal>,
    );
    await user.type(screen.getByLabelText('Title'), 'Write the README');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => {
      expect(back).toHaveBeenCalledOnce();
    });

    rerender(<></>);

    expect(screen.getByRole('status')).toHaveTextContent('Task created.');
  });

  it('starts a new task in To do', () => {
    renderWithTrpc(<TaskForm />);

    const todo = screen.getByRole('radio', { name: 'To do' });

    expect(todo).toBeChecked();
  });

  it('saves the chosen status', async () => {
    const repository = new InMemoryTaskRepository();
    const { user } = renderWithTrpc(<TaskForm />, { repository });
    await user.type(screen.getByLabelText('Title'), 'Write the README');
    await user.click(screen.getByRole('radio', { name: 'Doing' }));

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith('/');
    });
    expect(await makeCaller(repository).task.list({})).toMatchObject({
      items: [{ title: 'Write the README', status: 'doing' }],
    });
  });
});
