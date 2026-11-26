import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DayField } from '.';

describe('DayField', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 26, 12));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the chosen day in the field', () => {
    render(
      <DayField
        label="Created from"
        day={new Date(2026, 10, 20)}
        align="start"
        onDayChange={vi.fn()}
      />,
    );

    const field = screen.getByRole('button', {
      name: 'Created from Nov 20, 2026',
    });

    expect(field).toHaveAttribute('aria-expanded', 'false');
  });

  it('shows Pick a day without a day', () => {
    render(
      <DayField
        label="Created from"
        day={undefined}
        align="start"
        onDayChange={vi.fn()}
      />,
    );

    const field = screen.getByRole('button', {
      name: 'Created from Pick a day',
    });

    expect(field).toBeInTheDocument();
  });

  it('opens the calendar on the month of the chosen day', async () => {
    const user = userEvent.setup();
    render(
      <DayField
        label="Created from"
        day={new Date(2026, 9, 5)}
        align="start"
        onDayChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /^Created from/ }));

    expect(
      screen.getByRole('dialog', { name: 'Created from' }),
    ).toContainElement(screen.getByRole('grid', { name: 'October 2026' }));
    expect(
      screen.getByRole('button', { name: /^Created from/ }),
    ).toHaveAttribute('aria-expanded', 'true');
  });

  it('opens the calendar on the month of the earliest day without a day', async () => {
    const user = userEvent.setup();
    render(
      <DayField
        label="Created to"
        day={undefined}
        earliestDay={new Date(2026, 8, 10)}
        align="end"
        onDayChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /^Created to/ }));

    expect(
      screen.getByRole('grid', { name: 'September 2026' }),
    ).toBeInTheDocument();
  });

  it('moves the focus into the calendar when it opens', async () => {
    const user = userEvent.setup();
    render(
      <DayField
        label="Created from"
        day={new Date(2026, 10, 20)}
        align="start"
        onDayChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /^Created from/ }));

    expect(
      screen.getByRole('button', {
        name: 'Friday, November 20th, 2026, selected',
      }),
    ).toHaveFocus();
  });

  it('chooses a day and closes the calendar', async () => {
    const onDayChange = vi.fn();
    const user = userEvent.setup();
    render(
      <DayField
        label="Created from"
        day={undefined}
        align="start"
        onDayChange={onDayChange}
      />,
    );
    await user.click(screen.getByRole('button', { name: /^Created from/ }));

    await user.click(
      screen.getByRole('button', { name: 'Friday, November 20th, 2026' }),
    );

    expect(onDayChange).toHaveBeenCalledExactlyOnceWith(new Date(2026, 10, 20));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('returns the focus to the field after choosing a day', async () => {
    const user = userEvent.setup();
    render(
      <DayField
        label="Created from"
        day={undefined}
        align="start"
        onDayChange={vi.fn()}
      />,
    );
    await user.click(screen.getByRole('button', { name: /^Created from/ }));

    await user.click(
      screen.getByRole('button', { name: 'Friday, November 20th, 2026' }),
    );

    expect(screen.getByRole('button', { name: /^Created from/ })).toHaveFocus();
  });

  it('keeps the day when it is chosen again', async () => {
    const onDayChange = vi.fn();
    const user = userEvent.setup();
    render(
      <DayField
        label="Created from"
        day={new Date(2026, 10, 20)}
        align="start"
        onDayChange={onDayChange}
      />,
    );
    await user.click(screen.getByRole('button', { name: /^Created from/ }));

    await user.click(
      screen.getByRole('button', {
        name: 'Friday, November 20th, 2026, selected',
      }),
    );

    expect(onDayChange).toHaveBeenCalledExactlyOnceWith(new Date(2026, 10, 20));
  });

  it('closes the calendar with Escape and returns the focus', async () => {
    const user = userEvent.setup();
    render(
      <DayField
        label="Created from"
        day={undefined}
        align="start"
        onDayChange={vi.fn()}
      />,
    );
    await user.click(screen.getByRole('button', { name: /^Created from/ }));

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Created from/ })).toHaveFocus();
  });

  it('closes the calendar when the user clicks outside', async () => {
    const user = userEvent.setup();
    render(
      <>
        <DayField
          label="Created from"
          day={undefined}
          align="start"
          onDayChange={vi.fn()}
        />
        <p>Outside</p>
      </>,
    );
    await user.click(screen.getByRole('button', { name: /^Created from/ }));

    await user.click(screen.getByText('Outside'));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes the calendar when the focus leaves it', async () => {
    const user = userEvent.setup();
    render(
      <>
        <DayField
          label="Created from"
          day={undefined}
          align="start"
          onDayChange={vi.fn()}
        />
        <button type="button">After</button>
      </>,
    );
    await user.click(screen.getByRole('button', { name: /^Created from/ }));

    await user.tab();

    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('disables the days before the earliest day', async () => {
    const user = userEvent.setup();
    render(
      <DayField
        label="Created to"
        day={undefined}
        earliestDay={new Date(2026, 10, 20)}
        align="end"
        onDayChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /^Created to/ }));

    expect(
      screen.getByRole('button', { name: 'Thursday, November 19th, 2026' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Friday, November 20th, 2026' }),
    ).toBeEnabled();
  });

  it('disables the days after the latest day', async () => {
    const user = userEvent.setup();
    render(
      <DayField
        label="Created from"
        day={undefined}
        latestDay={new Date(2026, 10, 20)}
        align="start"
        onDayChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /^Created from/ }));

    expect(
      screen.getByRole('button', { name: 'Saturday, November 21st, 2026' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Friday, November 20th, 2026' }),
    ).toBeEnabled();
  });

  it('clears the day', async () => {
    const onDayChange = vi.fn();
    const user = userEvent.setup();
    render(
      <DayField
        label="Created from"
        day={new Date(2026, 10, 20)}
        align="start"
        onDayChange={onDayChange}
      />,
    );
    await user.click(screen.getByRole('button', { name: /^Created from/ }));

    await user.click(screen.getByRole('button', { name: 'Clear' }));

    expect(onDayChange).toHaveBeenCalledExactlyOnceWith(undefined);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('offers no Clear without a day', async () => {
    const user = userEvent.setup();
    render(
      <DayField
        label="Created from"
        day={undefined}
        align="start"
        onDayChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /^Created from/ }));

    expect(
      screen.queryByRole('button', { name: 'Clear' }),
    ).not.toBeInTheDocument();
  });
});
