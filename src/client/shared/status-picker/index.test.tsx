import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { StatusPicker } from '.';

describe('StatusPicker', () => {
  it('offers every status', () => {
    render(<StatusPicker value="todo" onChange={vi.fn()} />);

    const options = screen.getAllByRole('radio');

    expect(options).toEqual([
      screen.getByRole('radio', { name: 'To do' }),
      screen.getByRole('radio', { name: 'Doing' }),
      screen.getByRole('radio', { name: 'Done' }),
    ]);
  });

  it('offers All first when given its label', () => {
    render(
      <StatusPicker value={undefined} allLabel="All" onChange={vi.fn()} />,
    );

    const options = screen.getAllByRole('radio');

    expect(options).toEqual([
      screen.getByRole('radio', { name: 'All' }),
      screen.getByRole('radio', { name: 'To do' }),
      screen.getByRole('radio', { name: 'Doing' }),
      screen.getByRole('radio', { name: 'Done' }),
    ]);
  });

  it('groups the options under Status', () => {
    render(<StatusPicker value="todo" onChange={vi.fn()} />);

    const group = screen.getByRole('group', { name: 'Status' });

    expect(group).toContainElement(screen.getByRole('radio', { name: 'Done' }));
  });

  it('checks the given status', () => {
    render(<StatusPicker value="doing" onChange={vi.fn()} />);

    const doing = screen.getByRole('radio', { name: 'Doing' });

    expect(doing).toBeChecked();
  });

  it('checks All when there is no status', () => {
    render(
      <StatusPicker value={undefined} allLabel="All" onChange={vi.fn()} />,
    );

    const all = screen.getByRole('radio', { name: 'All' });

    expect(all).toBeChecked();
  });

  it('reports the chosen status', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StatusPicker value="todo" onChange={onChange} />);

    await user.click(screen.getByRole('radio', { name: 'Done' }));

    expect(onChange).toHaveBeenCalledWith('done');
  });

  it('reports no status when All is chosen', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StatusPicker value="doing" allLabel="All" onChange={onChange} />);

    await user.click(screen.getByRole('radio', { name: 'All' }));

    expect(onChange).toHaveBeenCalledWith(undefined);
  });
});
