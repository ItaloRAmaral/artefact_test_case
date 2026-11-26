import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TaskFilters } from '.';

describe('TaskFilters', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 26, 12));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the search and the days of the filter', () => {
    render(
      <TaskFilters
        filter={{
          titleContains: 'readme',
          createdFrom: '2026-11-20T03:00:00.000Z',
          createdBefore: '2026-11-21T03:00:00.000Z',
        }}
        onChange={vi.fn()}
      />,
    );

    const search = screen.getByRole('searchbox', { name: 'Search by title' });

    expect(search).toHaveValue('readme');
    expect(
      screen.getByRole('button', { name: 'Created from Nov 20, 2026' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Created to Nov 20, 2026' }),
    ).toBeInTheDocument();
  });

  it('applies the search after the user stops typing', () => {
    const onChange = vi.fn();
    render(<TaskFilters filter={{}} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Search by title'), {
      target: { value: 'readme' },
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith({ titleContains: 'readme' });
  });

  it('does not apply the search while the user is still typing', () => {
    const onChange = vi.fn();
    render(<TaskFilters filter={{}} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Search by title'), {
      target: { value: 'readme' },
    });

    act(() => {
      vi.advanceTimersByTime(299);
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('applies the search without surrounding spaces', () => {
    const onChange = vi.fn();
    render(<TaskFilters filter={{}} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Search by title'), {
      target: { value: '  readme  ' },
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onChange).toHaveBeenCalledWith({ titleContains: 'readme' });
  });

  it('removes the search when it is cleared', () => {
    const onChange = vi.fn();
    render(
      <TaskFilters filter={{ titleContains: 'readme' }} onChange={onChange} />,
    );
    fireEvent.change(screen.getByLabelText('Search by title'), {
      target: { value: '' },
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onChange).toHaveBeenCalledWith({ titleContains: undefined });
  });

  it('does not apply the search from the filter again', () => {
    const onChange = vi.fn();
    render(
      <TaskFilters filter={{ titleContains: 'readme' }} onChange={onChange} />,
    );

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('applies the start of the From day in local time', () => {
    const onChange = vi.fn();
    render(<TaskFilters filter={{}} onChange={onChange} />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Created from Pick a day' }),
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Friday, November 20th, 2026' }),
    );

    expect(onChange).toHaveBeenCalledWith({
      createdFrom: '2026-11-20T03:00:00.000Z',
    });
  });

  it('applies the start of the day after To in local time', () => {
    const onChange = vi.fn();
    render(<TaskFilters filter={{}} onChange={onChange} />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Created to Pick a day' }),
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Friday, November 20th, 2026' }),
    );

    expect(onChange).toHaveBeenCalledWith({
      createdBefore: '2026-11-21T03:00:00.000Z',
    });
  });

  it('removes a date when it is cleared', () => {
    const onChange = vi.fn();
    render(
      <TaskFilters
        filter={{ createdFrom: '2026-11-20T03:00:00.000Z' }}
        onChange={onChange}
      />,
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Created from Nov 20, 2026' }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));

    expect(onChange).toHaveBeenCalledWith({ createdFrom: undefined });
  });

  it('keeps the other filters when a date changes', () => {
    const onChange = vi.fn();
    render(
      <TaskFilters filter={{ titleContains: 'readme' }} onChange={onChange} />,
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Created from Pick a day' }),
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Friday, November 20th, 2026' }),
    );

    expect(onChange).toHaveBeenCalledWith({
      titleContains: 'readme',
      createdFrom: '2026-11-20T03:00:00.000Z',
    });
  });

  it('keeps the dates when the search changes', () => {
    const onChange = vi.fn();
    render(
      <TaskFilters
        filter={{ createdFrom: '2026-11-20T03:00:00.000Z' }}
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByLabelText('Search by title'), {
      target: { value: 'readme' },
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onChange).toHaveBeenCalledWith({
      titleContains: 'readme',
      createdFrom: '2026-11-20T03:00:00.000Z',
    });
  });

  it('keeps To from starting before From', () => {
    render(
      <TaskFilters
        filter={{ createdFrom: '2026-11-20T03:00:00.000Z' }}
        onChange={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Created to Pick a day' }),
    );

    expect(
      screen.getByRole('button', { name: 'Thursday, November 19th, 2026' }),
    ).toBeDisabled();
  });

  it('keeps From from ending after To', () => {
    render(
      <TaskFilters
        filter={{ createdBefore: '2026-11-23T03:00:00.000Z' }}
        onChange={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Created from Pick a day' }),
    );

    expect(
      screen.getByRole('button', { name: 'Monday, November 23rd, 2026' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Sunday, November 22nd, 2026' }),
    ).toBeEnabled();
  });

  it('clears every filter at once', () => {
    const onChange = vi.fn();
    render(
      <TaskFilters
        filter={{
          titleContains: 'readme',
          createdFrom: '2026-11-20T03:00:00.000Z',
          createdBefore: '2026-11-21T03:00:00.000Z',
        }}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith({});
    expect(screen.getByLabelText('Search by title')).toHaveValue('');
  });

  it('clears a search that is still being typed', () => {
    const onChange = vi.fn();
    render(<TaskFilters filter={{}} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Search by title'), {
      target: { value: 'readme' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));

    expect(screen.getByLabelText('Search by title')).toHaveValue('');
  });

  it('disables Clear when there is no filter', () => {
    render(<TaskFilters filter={{}} onChange={vi.fn()} />);

    const clear = screen.getByRole('button', { name: 'Clear filters' });

    expect(clear).toBeDisabled();
  });

  it('applies a status', () => {
    const onChange = vi.fn();
    render(<TaskFilters filter={{}} onChange={onChange} />);

    fireEvent.click(screen.getByRole('radio', { name: 'Doing' }));

    expect(onChange).toHaveBeenCalledWith({ status: 'doing' });
  });

  it('removes the status when All is chosen', () => {
    const onChange = vi.fn();
    render(<TaskFilters filter={{ status: 'doing' }} onChange={onChange} />);

    fireEvent.click(screen.getByRole('radio', { name: 'All' }));

    expect(onChange).toHaveBeenCalledWith({ status: undefined });
  });

  it('shows the status of the filter', () => {
    render(<TaskFilters filter={{ status: 'done' }} onChange={vi.fn()} />);

    const done = screen.getByRole('radio', { name: 'Done' });

    expect(done).toBeChecked();
  });

  it('offers every status and All', () => {
    render(<TaskFilters filter={{}} onChange={vi.fn()} />);

    const options = screen.getAllByRole('radio');

    expect(options).toEqual([
      screen.getByRole('radio', { name: 'All' }),
      screen.getByRole('radio', { name: 'To do' }),
      screen.getByRole('radio', { name: 'Doing' }),
      screen.getByRole('radio', { name: 'Done' }),
    ]);
  });

  it('enables Clear when only a status is set', () => {
    render(<TaskFilters filter={{ status: 'todo' }} onChange={vi.fn()} />);

    const clear = screen.getByRole('button', { name: 'Clear filters' });

    expect(clear).toBeEnabled();
  });

  it('keeps the other filters when the status changes', () => {
    const onChange = vi.fn();
    render(
      <TaskFilters filter={{ titleContains: 'readme' }} onChange={onChange} />,
    );

    fireEvent.click(screen.getByRole('radio', { name: 'Done' }));

    expect(onChange).toHaveBeenCalledWith({
      titleContains: 'readme',
      status: 'done',
    });
  });
});
