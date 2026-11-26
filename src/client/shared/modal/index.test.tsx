import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Activity } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { CloseModal } from './dto';
import { Modal, useCloseModal } from '.';

const { back } = vi.hoisted(() => ({ back: vi.fn<() => void>() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back }),
}));

function DoneButton({ afterClose }: { afterClose: () => void }) {
  const closeModal = useCloseModal();

  return (
    <button type="button" onClick={() => closeModal?.(afterClose)}>
      Done
    </button>
  );
}

function CaptureClose({
  onCapture,
}: {
  onCapture: (closeModal: CloseModal | null) => void;
}) {
  onCapture(useCloseModal());

  return null;
}

describe('Modal', () => {
  afterEach(() => {
    back.mockReset();
  });

  it('shows the title and the content in an open dialog', () => {
    render(
      <Modal title="New task">
        <p>Form</p>
      </Modal>,
    );

    const dialog = screen.getByRole('dialog', { name: 'New task' });

    expect(dialog).toHaveAttribute('open');
    expect(dialog).toContainElement(screen.getByText('Form'));
  });

  it('goes back when Close is pressed', async () => {
    const user = userEvent.setup();
    render(<Modal title="New task">Form</Modal>);

    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(back).toHaveBeenCalledOnce();
  });

  it('goes back when Escape is pressed, instead of closing by itself', () => {
    render(<Modal title="New task">Form</Modal>);

    const notPrevented = fireEvent(
      screen.getByRole('dialog'),
      new Event('cancel', { cancelable: true }),
    );

    expect(back).toHaveBeenCalledOnce();
    expect(notPrevented).toBe(false);
  });

  it('goes back when the backdrop is clicked', async () => {
    const user = userEvent.setup();
    render(<Modal title="New task">Form</Modal>);

    await user.click(screen.getByRole('dialog'));

    expect(back).toHaveBeenCalledOnce();
  });

  it('stays open when a press inside the content ends outside', () => {
    render(
      <Modal title="New task">
        <input aria-label="Title" />
      </Modal>,
    );
    fireEvent.pointerDown(screen.getByRole('textbox', { name: 'Title' }));

    fireEvent.click(screen.getByRole('dialog'));

    expect(back).not.toHaveBeenCalled();
  });

  it('stays open when the content is clicked', async () => {
    const user = userEvent.setup();
    render(
      <Modal title="New task">
        <p>Form</p>
      </Modal>,
    );

    await user.click(screen.getByText('Form'));

    expect(back).not.toHaveBeenCalled();
  });

  it('does not go back when it unmounts', () => {
    const { unmount } = render(<Modal title="New task">Form</Modal>);

    unmount();

    expect(back).not.toHaveBeenCalled();
  });

  it('closes the dialog when it unmounts', () => {
    const { unmount } = render(<Modal title="New task">Form</Modal>);
    const dialog = screen.getByRole('dialog');

    unmount();

    expect(dialog).not.toHaveAttribute('open');
  });

  it('goes back without the after-close step while the dialog is open', async () => {
    const afterClose = vi.fn();
    const user = userEvent.setup();
    render(
      <Modal title="New task">
        <DoneButton afterClose={afterClose} />
      </Modal>,
    );

    await user.click(screen.getByRole('button', { name: 'Done' }));

    expect(back).toHaveBeenCalledOnce();
    expect(afterClose).not.toHaveBeenCalled();
  });

  it('runs the after-close step once the dialog has closed', async () => {
    const afterClose = vi.fn();
    const user = userEvent.setup();
    const { unmount } = render(
      <Modal title="New task">
        <DoneButton afterClose={afterClose} />
      </Modal>,
    );
    await user.click(screen.getByRole('button', { name: 'Done' }));

    unmount();

    expect(afterClose).toHaveBeenCalledOnce();
  });

  it('gives no close step outside a modal', async () => {
    const afterClose = vi.fn();
    const user = userEvent.setup();
    render(<DoneButton afterClose={afterClose} />);

    await user.click(screen.getByRole('button', { name: 'Done' }));

    expect(back).not.toHaveBeenCalled();
    expect(afterClose).not.toHaveBeenCalled();
  });

  it('goes back once when Close is clicked twice', async () => {
    const user = userEvent.setup();
    render(<Modal title="New task">Form</Modal>);

    await user.dblClick(screen.getByRole('button', { name: 'Close' }));

    expect(back).toHaveBeenCalledOnce();
  });

  it('goes back once when Escape follows Close', async () => {
    const user = userEvent.setup();
    render(<Modal title="New task">Form</Modal>);
    await user.click(screen.getByRole('button', { name: 'Close' }));

    fireEvent(
      screen.getByRole('dialog'),
      new Event('cancel', { cancelable: true }),
    );

    expect(back).toHaveBeenCalledOnce();
  });

  it('runs the after-close step at once when the modal has already closed', () => {
    const afterClose = vi.fn();
    const captured: { closeModal: CloseModal | null } = { closeModal: null };
    const { unmount } = render(
      <Modal title="New task">
        <CaptureClose
          onCapture={(closeModal) => {
            captured.closeModal = closeModal;
          }}
        />
      </Modal>,
    );
    unmount();

    captured.closeModal?.(afterClose);

    expect(afterClose).toHaveBeenCalledOnce();
    expect(back).not.toHaveBeenCalled();
  });

  it('moves the focus to the first field when it opens', () => {
    render(
      <Modal title="New task">
        <label>
          Title
          <input />
        </label>
      </Modal>,
    );

    const titleBox = screen.getByRole('textbox', { name: 'Title' });

    expect(titleBox).toHaveFocus();
  });

  it('goes back again when it is shown again after closing', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <Activity mode="visible">
        <Modal title="New task">Form</Modal>
      </Activity>,
    );
    await user.click(screen.getByRole('button', { name: 'Close' }));
    rerender(
      <Activity mode="hidden">
        <Modal title="New task">Form</Modal>
      </Activity>,
    );
    rerender(
      <Activity mode="visible">
        <Modal title="New task">Form</Modal>
      </Activity>,
    );

    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(back).toHaveBeenCalledTimes(2);
  });
});
