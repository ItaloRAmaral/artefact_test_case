'use client';

import { useId, useRef, useState } from 'react';
import { DayPicker } from 'react-day-picker';

import { CalendarIcon } from '@/client/shared/icons';

const DAY_FORMAT = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' });

const CALENDAR_CLASS_NAMES = {
  root: 'relative text-sm',
  month_caption: 'flex h-8 items-center px-1 font-semibold',
  nav: 'absolute top-0 right-0 flex gap-0.5',
  button_previous: 'icon-button size-8',
  button_next: 'icon-button size-8',
  chevron: 'size-4 fill-current',
  month_grid: 'mt-2 border-collapse',
  weekday: 'text-ink-muted size-9 text-xs font-medium',
  day: 'p-0 text-center',
  day_button:
    'focus-visible:outline-accent size-9 cursor-pointer rounded-lg transition-colors hover:bg-ink/5 focus-visible:outline-2 disabled:cursor-not-allowed',
  today: 'text-accent font-semibold',
  selected:
    '[&>button]:bg-accent [&>button]:text-accent-contrast [&>button]:hover:bg-accent/90',
  disabled: 'opacity-40',
  outside: 'invisible',
};

/**
 * Renders a field that shows a day and picks it from a calendar in a panel below it.
 *
 * @param props.label - The field's label.
 * @param props.day - The chosen day, at local midnight, or `undefined` for none.
 * @param props.earliestDay - The first day that can be chosen; any day when absent.
 * @param props.latestDay - The last day that can be chosen; any day when absent.
 * @param props.align - The edge of the field the panel lines up with.
 * @param props.onDayChange - Called with the chosen day, or `undefined` when it is cleared.
 * @returns The field and, while open, its panel.
 */
export function DayField({
  label,
  day,
  earliestDay,
  latestDay,
  align,
  onDayChange,
}: {
  label: string;
  day: Date | undefined;
  earliestDay?: Date;
  latestDay?: Date;
  align: 'start' | 'end';
  onDayChange: (day: Date | undefined) => void;
}) {
  const labelId = useId();
  const valueId = useId();
  const fieldRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  function closeAndFocusField() {
    setIsOpen(false);
    fieldRef.current?.focus();
  }

  return (
    <div
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsOpen(false);
        }
      }}
    >
      <span id={labelId} className="mb-1 block text-sm font-medium">
        {label}
      </span>
      <button
        ref={fieldRef}
        type="button"
        className="field flex h-10 cursor-pointer items-center justify-between gap-2 px-2 text-left sm:w-38 sm:px-3"
        aria-labelledby={`${labelId} ${valueId}`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => {
          setIsOpen(!isOpen);
        }}
      >
        <span
          id={valueId}
          className={day === undefined ? 'text-ink-muted' : undefined}
        >
          {day === undefined ? 'Pick a day' : DAY_FORMAT.format(day)}
        </span>
        <CalendarIcon className="text-ink-muted size-4 shrink-0" />
      </button>
      {isOpen ? (
        <div
          role="dialog"
          aria-labelledby={labelId}
          tabIndex={-1}
          className={`card absolute top-full z-20 mt-1.5 p-3 shadow-lg focus:outline-none ${align === 'start' ? 'left-0' : 'right-0'}`}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              closeAndFocusField();
            }
          }}
        >
          <DayPicker
            mode="single"
            required
            selected={day}
            defaultMonth={day ?? earliestDay}
            disabled={[
              ...(earliestDay === undefined ? [] : [{ before: earliestDay }]),
              ...(latestDay === undefined ? [] : [{ after: latestDay }]),
            ]}
            autoFocus
            classNames={CALENDAR_CLASS_NAMES}
            onSelect={(chosen) => {
              onDayChange(chosen);
              closeAndFocusField();
            }}
          />
          {day === undefined ? null : (
            <button
              type="button"
              className="button text-accent hover:bg-ink/5 mt-1 px-2 py-1"
              onClick={() => {
                onDayChange(undefined);
                closeAndFocusField();
              }}
            >
              Clear
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
